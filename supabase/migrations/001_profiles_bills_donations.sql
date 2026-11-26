-- =====================================================================
-- Chief — profiles, bills & donations (idempotent, non-destructive)
-- Safe to re-run: every object is created conditionally, existing rows
-- are preserved, and no permissions are weakened.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Enum types
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('donor', 'bill_requester', 'admin');
  END IF;
END $$;

-- If the type pre-existed without these values, add them. NOTE: values added
-- here are not referenced as enum literals anywhere else in this migration
-- (Postgres forbids using a freshly added enum value in the same transaction).
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'donor';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'bill_requester';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'bill_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.bill_status AS ENUM ('pending', 'approved', 'rejected', 'funded');
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'donor',
  full_name text,
  avatar_url text,
  city text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Requested live column (preserves existing rows; NULL for old rows).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

CREATE TABLE IF NOT EXISTS public.bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 140),
  description text,
  category text NOT NULL DEFAULT 'Utilities',
  city text,
  goal_amount bigint NOT NULL CHECK (goal_amount > 0),
  raised_amount bigint NOT NULL DEFAULT 0 CHECK (raised_amount >= 0),
  status public.bill_status NOT NULL DEFAULT 'pending',
  image_url text,
  proof_url text,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Requested live column (preserves existing rows; NULL for old rows).
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS review_note text;

CREATE INDEX IF NOT EXISTS bills_requester_idx ON public.bills (requester_id);
CREATE INDEX IF NOT EXISTS bills_status_idx ON public.bills (status);

CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.bills (id) ON DELETE CASCADE,
  donor_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  paystack_reference text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS donations_bill_idx ON public.donations (bill_id);
CREATE INDEX IF NOT EXISTS donations_donor_idx ON public.donations (donor_id);

-- ---------------------------------------------------------------------
-- 3. Helper: is the current user an admin? (text comparison avoids
--    enum-literal use in this transaction)
-- ---------------------------------------------------------------------
-- One admin check only: a zero-argument copy next to is_admin(uid DEFAULT auth.uid())
-- makes every "public.is_admin()" call ambiguous, so keep just the uuid form.
DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
DROP POLICY IF EXISTS bills_select_public_own_admin ON public.bills;
DROP FUNCTION IF EXISTS public.is_admin();
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role::text = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon, authenticated;

CREATE POLICY profiles_select_own_or_admin ON public.profiles FOR SELECT
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY bills_select_public_own_admin ON public.bills FOR SELECT
  USING (status IN ('approved','funded') OR requester_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------
-- 4. New-user trigger: create a profile with the chosen sign-up role.
--    Only 'donor' and 'bill_requester' are self-selectable; anything else
--    (including 'admin') falls back to 'donor'. The cast happens at runtime,
--    after this migration has committed.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested text := coalesce(NEW.raw_user_meta_data ->> 'role', 'donor');
  chosen text;
BEGIN
  IF requested IN ('donor', 'bill_requester') THEN
    chosen := requested;
  ELSE
    chosen := 'donor';
  END IF;

  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    chosen::public.user_role,
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill profiles for existing users (default role only; never touches
-- existing profile rows).
INSERT INTO public.profiles (id, email)
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Fill missing emails on existing profiles without overwriting anything.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- ---------------------------------------------------------------------
-- 5. Guard: users cannot change their own role (admins / service may).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'You cannot change your account role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_change ON public.profiles;
CREATE TRIGGER profiles_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_change();

-- ---------------------------------------------------------------------
-- 6. Row level security
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Profiles: read own" ON public.profiles;
CREATE POLICY "Profiles: read own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;
CREATE POLICY "Profiles: update own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- bills
DROP POLICY IF EXISTS "Bills: public read approved" ON public.bills;
CREATE POLICY "Bills: public read approved" ON public.bills
  FOR SELECT TO anon, authenticated
  USING (status::text IN ('approved', 'funded'));

DROP POLICY IF EXISTS "Bills: owner read own" ON public.bills;
CREATE POLICY "Bills: owner read own" ON public.bills
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Bills: owner insert pending" ON public.bills;
CREATE POLICY "Bills: owner insert pending" ON public.bills
  FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND status::text = 'pending'
    AND raised_amount = 0
    AND review_note IS NULL
  );

DROP POLICY IF EXISTS "Bills: admin update" ON public.bills;
CREATE POLICY "Bills: admin update" ON public.bills
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- donations (writes happen server-side via the payment edge function)
DROP POLICY IF EXISTS "Donations: donor read own" ON public.donations;
CREATE POLICY "Donations: donor read own" ON public.donations
  FOR SELECT TO authenticated
  USING (
    donor_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = donations.bill_id AND b.requester_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 7. Grants (RLS still applies on top of these)
-- ---------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.bills TO anon, authenticated;
GRANT INSERT, UPDATE ON public.bills TO authenticated;
GRANT SELECT ON public.donations TO authenticated;

