-- =====================================================================
-- Module 7 — realtime donations & Paystack payment reference columns
-- Idempotent and non-destructive: preserves rows, never weakens RLS.
-- =====================================================================

alter table public.donations
  add column if not exists paystack_reference text,
  add column if not exists payment_reference text,
  add column if not exists currency text not null default 'NGN',
  add column if not exists paid_at timestamptz;

create unique index if not exists donations_paystack_reference_key
  on public.donations (paystack_reference);
create unique index if not exists donations_payment_reference_key
  on public.donations (payment_reference);

-- Full row images so realtime UPDATE payloads include every column.
alter table public.donations replica identity full;
alter table public.bills replica identity full;

-- Add both tables to the realtime publication (RLS still filters events).
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'donations'
  ) then
    alter publication supabase_realtime add table public.donations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'bills'
  ) then
    alter publication supabase_realtime add table public.bills;
  end if;
end $$;
