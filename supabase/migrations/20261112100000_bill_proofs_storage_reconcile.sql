-- Reconcile the bill-proofs storage bucket and its policies (Module 6).
-- Fully idempotent so it succeeds regardless of which earlier migrations applied.
-- Files live at <auth.uid()>/<timestamp>-<name> (see src/services/bills.ts).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bill-proofs',
  'bill-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.bill_proofs_is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role::text = 'admin'
  );
$$;

revoke all on function public.bill_proofs_is_admin(uuid) from public;
grant execute on function public.bill_proofs_is_admin(uuid) to authenticated;

drop policy if exists "bill_proofs_owner_insert" on storage.objects;
create policy "bill_proofs_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bill-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "bill_proofs_owner_or_admin_select" on storage.objects;
create policy "bill_proofs_owner_or_admin_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bill-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.bill_proofs_is_admin(auth.uid())
    )
  );

drop policy if exists "bill_proofs_owner_update" on storage.objects;
create policy "bill_proofs_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'bill-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'bill-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "bill_proofs_owner_delete" on storage.objects;
create policy "bill_proofs_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bill-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
