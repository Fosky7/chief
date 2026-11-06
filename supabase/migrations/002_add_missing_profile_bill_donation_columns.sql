-- Add fields introduced after the foundation migration was applied.
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS preserves all existing rows and
-- makes this migration safe to apply to both existing and new environments.

begin;

alter table public.profiles
  add column if not exists email text,
  add column if not exists avatar_url text,
  add column if not exists city text;

-- Backfill profile emails from auth.users without overwriting existing values.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

alter table public.bills
  add column if not exists amount_required bigint,
  add column if not exists amount_raised bigint default 0,
  add column if not exists document_url text,
  add column if not exists review_note text;

-- Existing rows cannot be assigned a fabricated required amount, so
-- amount_required remains nullable for upgraded data. New amount_raised values
-- default to zero and existing null values can be backfilled without data loss.
update public.bills
set amount_raised = 0
where amount_raised is null;

alter table public.bills
  alter column amount_raised set default 0,
  alter column amount_raised set not null;

alter table public.donations
  add column if not exists payment_reference text,
  add column if not exists updated_at timestamptz default timezone('utc', now());

update public.donations
set updated_at = timezone('utc', now())
where updated_at is null;

alter table public.donations
  alter column updated_at set default timezone('utc', now()),
  alter column updated_at set not null;

create unique index if not exists donations_payment_reference_key
  on public.donations (payment_reference);

commit;
