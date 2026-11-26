-- Bills may only be created by the signed-in user who owns them.
--
-- A permissive INSERT policy alone allows a signed-in user to insert a row that
-- names somebody else as the owner. A RESTRICTIVE policy is ANDed with every
-- existing permissive policy, so foreign inserts are rejected while the normal
-- "create my own bill" flow keeps working. Guarded so it is a no-op on any
-- database whose bills table / owner column is named differently.
do $$
declare
  owner_col text;
begin
  if to_regclass('public.bills') is null then
    return;
  end if;

  select column_name
    into owner_col
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'bills'
     and column_name in ('requester_id', 'user_id', 'created_by', 'owner_id')
   order by array_position(
     array['requester_id', 'user_id', 'created_by', 'owner_id'],
     column_name
   )
   limit 1;

  if owner_col is null then
    return;
  end if;

  execute 'drop policy if exists "bills_insert_must_own" on public.bills';
  execute format(
    'create policy "bills_insert_must_own" on public.bills as restrictive for insert to authenticated with check (%I = auth.uid())',
    owner_col
  );
end $$;
