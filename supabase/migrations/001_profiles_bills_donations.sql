-- Chief: profiles, bills and donations (Naira only)

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('donor', 'requester', 'admin');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'donor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- Users may not change their own role (prevents self-promotion to admin).
-- Direct SQL (no auth.uid()) is allowed so operators can promote admins.
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change account roles';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Create a profile for every new auth user. Only donor/requester can be
-- chosen at sign up; anything else falls back to donor.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'donor');
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    case when requested = 'requester' then 'requester'::public.user_role
         else 'donor'::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant select, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Bills
-- ---------------------------------------------------------------------------
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  description text not null default '',
  category text not null check (category in ('Education', 'Health', 'Housing', 'Utilities')),
  city text not null,
  goal_amount bigint not null check (goal_amount > 0),
  raised_amount bigint not null default 0 check (raised_amount >= 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  image_url text,
  proof_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'funded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bills_status_idx on public.bills (status, created_at desc);
create index if not exists bills_requester_idx on public.bills (requester_id);

alter table public.bills enable row level security;

drop policy if exists "bills_select_public_own_admin" on public.bills;
create policy "bills_select_public_own_admin" on public.bills
  for select to anon, authenticated
  using (
    status in ('approved', 'funded')
    or requester_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "bills_insert_own_pending" on public.bills;
create policy "bills_insert_own_pending" on public.bills
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and status = 'pending'
    and raised_amount = 0
  );

drop policy if exists "bills_update_admin" on public.bills;
create policy "bills_update_admin" on public.bills
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select on public.bills to anon, authenticated;
grant insert, update on public.bills to authenticated;

-- ---------------------------------------------------------------------------
-- Donations (written by the Paystack edge function using the service role)
-- ---------------------------------------------------------------------------
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  donor_id uuid references auth.users(id) on delete set null,
  amount bigint not null check (amount > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  paystack_reference text unique,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  created_at timestamptz not null default now()
);

create index if not exists donations_bill_idx on public.donations (bill_id);
create index if not exists donations_donor_idx on public.donations (donor_id);

alter table public.donations enable row level security;

drop policy if exists "donations_select_own_or_admin" on public.donations;
create policy "donations_select_own_or_admin" on public.donations
  for select to authenticated
  using (donor_id = auth.uid() or public.is_admin());

grant select on public.donations to authenticated;
