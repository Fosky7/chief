-- Provision the "bill-proofs" storage bucket used by the Proof of bill upload on /bills/new.
-- Idempotent: safe to re-run; it never deletes existing objects or data.
-- Visibility: proofs are shown on public bill pages so donors can verify a bill,
-- so reads are public. Writes are limited to signed-in users, and only the
-- uploader (owner) may replace or delete their own files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bill-proofs',
  'bill-proofs',
  true,
  10485760,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "bill_proofs_public_read" on storage.objects;
create policy "bill_proofs_public_read"
  on storage.objects for select
  using (bucket_id = 'bill-proofs');

drop policy if exists "bill_proofs_authenticated_insert" on storage.objects;
create policy "bill_proofs_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bill-proofs' and auth.uid() is not null);

drop policy if exists "bill_proofs_owner_update" on storage.objects;
create policy "bill_proofs_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid())
  with check (bucket_id = 'bill-proofs' and owner = auth.uid());

drop policy if exists "bill_proofs_owner_delete" on storage.objects;
create policy "bill_proofs_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());
