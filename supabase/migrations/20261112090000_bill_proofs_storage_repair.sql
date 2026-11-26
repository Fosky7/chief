-- Idempotent repair for the bill-proofs storage bucket (Module 6).
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

-- Admin check that does not depend on the caller's RLS view of profiles
-- (avoids policy evaluation errors during upload RETURNING checks).
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

-- Owners may upload into their own folder.
drop policy if exists "bill_proofs_owner_insert" on storage.objects;
create policy "bill_proofs_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bill-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners read their own proofs; admins read all for review.
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

-- Owners may replace their own proofs.
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

-- Owners may delete their own proofs (cleanup of failed submissions).
drop policy if exists "bill_proofs_owner_delete" on storage.objects;
create policy "bill_proofs_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bill-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
