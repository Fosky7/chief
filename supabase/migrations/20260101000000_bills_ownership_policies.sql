-- Bills access rules: a row may only ever be created on behalf of the
-- signed-in account, while approved bills stay publicly readable and admins
-- keep the access they need to review and pay out submissions.
--
-- Written defensively (dynamic SQL) so it applies cleanly regardless of which
-- owner column spelling the deployed table uses.

do $$
declare
  has_user boolean;
  has_requester boolean;
  owner_expr text;
  admin_expr text;
  pol record;
begin
  if to_regclass('public.bills') is null then
    return;
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bills' and column_name = 'user_id'
  ) into has_user;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bills' and column_name = 'requester_id'
  ) into has_requester;

  if has_user and has_requester then
    owner_expr := 'coalesce(user_id, requester_id)';
  elsif has_user then
    owner_expr := 'user_id';
  elsif has_requester then
    owner_expr := 'requester_id';
  else
    return;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    admin_expr := 'exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text = ''admin'')';
  else
    admin_expr := 'coalesce(auth.jwt() -> ''app_metadata'' ->> ''role'', auth.jwt() -> ''user_metadata'' ->> ''role'') = ''admin''';
  end if;

  execute 'alter table public.bills enable row level security';

  -- Replace the permissive policies that let one account write rows for another.
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'bills'
  loop
    execute format('drop policy if exists %I on public.bills', pol.policyname);
  end loop;

  -- Public catalogue: approved bills only, plus the owner's own rows and admins.
  execute format(
    'create policy bills_select_visible on public.bills for select using (status = ''approved'' or %s = auth.uid() or %s)',
    owner_expr, admin_expr
  );

  -- A new bill may only be attributed to the account that submits it.
  execute format(
    'create policy bills_insert_own on public.bills for insert to authenticated with check (%s = auth.uid())',
    owner_expr
  );

  execute format(
    'create policy bills_update_own on public.bills for update using (%s = auth.uid() or %s) with check (%s = auth.uid() or %s)',
    owner_expr, admin_expr, owner_expr, admin_expr
  );

  execute format(
    'create policy bills_delete_own on public.bills for delete using (%s = auth.uid() or %s)',
    owner_expr, admin_expr
  );
end $$;
