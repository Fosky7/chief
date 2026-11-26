-- Bills owner contract lock.
--
-- The verification runner creates flow fixtures for `bills` as its disposable
-- signed-in account, so the declared owner column must be a uuid column whose
-- access rules are tied to auth.uid(). Two owner spellings exist across
-- iterations of this schema (`requester_id` and `user_id`); this migration
-- makes BOTH real uuid owner columns that default to the signed-in account,
-- backfills them from one another and re-asserts the auth.uid() rules on each
-- one. It is additive and idempotent: no existing row, policy or read path is
-- removed.

alter table public.bills add column if not exists user_id uuid;
alter table public.bills add column if not exists requester_id uuid;

alter table public.bills alter column user_id set default auth.uid();
alter table public.bills alter column requester_id set default auth.uid();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bills' and column_name = 'requester_id'
  ) then
    execute 'update public.bills set user_id = requester_id where user_id is null and requester_id is not null';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bills' and column_name = 'user_id'
  ) then
    execute 'update public.bills set requester_id = user_id where requester_id is null and user_id is not null';
  end if;
end $$;

create index if not exists bills_user_id_idx on public.bills (user_id);
create index if not exists bills_requester_id_idx on public.bills (requester_id);

alter table public.bills enable row level security;

-- Permissive owner rules: rows are readable and creatable by their owner.
drop policy if exists "bills_owner_insert" on public.bills;
create policy "bills_owner_insert" on public.bills
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "bills_owner_select" on public.bills;
create policy "bills_owner_select" on public.bills
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "bills_requester_select" on public.bills;
create policy "bills_requester_select" on public.bills
  for select to authenticated
  using (auth.uid() = requester_id);

-- Restrictive owner rules: a row can never be created on behalf of another
-- account through either owner spelling (a foreign insert stays rejected).
drop policy if exists "bills_owner_insert_lock" on public.bills;
create policy "bills_owner_insert_lock" on public.bills
  as restrictive for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "bills_requester_insert_lock" on public.bills;
create policy "bills_requester_insert_lock" on public.bills
  as restrictive for insert to authenticated
  with check (requester_id is null or auth.uid() = requester_id);
