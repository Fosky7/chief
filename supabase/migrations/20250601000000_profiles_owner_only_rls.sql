-- Restrict profiles so one account can never read or change another account's row.
alter table public.profiles enable row level security;

-- Remove any previous (too permissive) policies on profiles.
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', p.policyname);
  end loop;
end $$;

-- Admin check that bypasses RLS (avoids policy recursion on profiles).
create or replace function public.is_profile_admin(uid uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles where id = uid and role::text = 'admin'
  );
exception when others then
  return false;
end;
$$;

revoke all on function public.is_profile_admin(uuid) from public;
grant execute on function public.is_profile_admin(uuid) to authenticated;

create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy "profiles_select_admin" on public.profiles
  for select to authenticated
  using (public.is_profile_admin(auth.uid()));

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
