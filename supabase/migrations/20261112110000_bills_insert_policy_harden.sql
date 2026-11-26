-- Remove any unconditional INSERT (or ALL) policy on public.bills so that
-- inserts require verified ownership via bills_owner_insert.
do $$
declare
  p record;
begin
  for p in
    select policyname, cmd, qual, with_check
    from pg_policies
    where schemaname = 'public' and tablename = 'bills'
  loop
    if p.policyname = 'bills_owner_insert' then
      continue;
    end if;
    if (p.cmd = 'INSERT' and coalesce(btrim(p.with_check), 'true') in ('true', '(true)'))
       or (p.cmd = 'ALL' and coalesce(btrim(p.with_check), btrim(p.qual), 'true') in ('true', '(true)')) then
      execute format('drop policy if exists %I on public.bills', p.policyname);
    end if;
  end loop;
end $$;

alter table public.bills enable row level security;

drop policy if exists "bills_owner_insert" on public.bills;
create policy "bills_owner_insert" on public.bills
  for insert to authenticated
  with check (auth.uid() is not null and auth.uid() = user_id);
