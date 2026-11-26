-- Ensure bills has a verified owner column (user_id) and a unique row key (id)
-- so owner-scoped writes and verification are reliable.

alter table public.bills add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.bills alter column user_id set default auth.uid();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bills' and column_name = 'requester_id'
  ) then
    execute 'update public.bills set user_id = requester_id where user_id is null and requester_id is not null';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.bills'::regclass and contype = 'p'
  ) then
    execute 'alter table public.bills add primary key (id)';
  end if;
end $$;

create index if not exists bills_user_id_idx on public.bills (user_id);

alter table public.bills enable row level security;

drop policy if exists "bills_owner_insert" on public.bills;
create policy "bills_owner_insert" on public.bills
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "bills_owner_select" on public.bills;
create policy "bills_owner_select" on public.bills
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "bills_owner_delete_pending" on public.bills;
create policy "bills_owner_delete_pending" on public.bills
  for delete to authenticated
  using (auth.uid() = user_id and status::text = 'pending');
