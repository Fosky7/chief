-- Private storage bucket for bill proof uploads (photos / PDFs).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bill-proofs',
  'bill-proofs',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Owners may upload into their own folder: <auth.uid()>/<file>
drop policy if exists "bill_proofs_owner_insert" on storage.objects;
create policy "bill_proofs_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bill-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Owners may read their own proofs; admins may read all proofs for review.
drop policy if exists "bill_proofs_owner_or_admin_select" on storage.objects;
create policy "bill_proofs_owner_or_admin_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bill-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role::text = 'admin'
      )
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

-- Owners may delete their own proofs (used to clean up failed submissions).
drop policy if exists "bill_proofs_owner_delete" on storage.objects;
create policy "bill_proofs_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bill-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
