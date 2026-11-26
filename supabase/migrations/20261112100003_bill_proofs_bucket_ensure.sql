-- Ensure the private "bill-proofs" storage bucket exists (idempotent).
-- Proof-of-bill files are private: only the uploader can read, replace or delete their own files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bill-proofs',
  'bill-proofs',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "bill_proofs_insert_authenticated" on storage.objects;
create policy "bill_proofs_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bill-proofs' and auth.uid() is not null);

drop policy if exists "bill_proofs_select_own" on storage.objects;
create policy "bill_proofs_select_own"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());

drop policy if exists "bill_proofs_update_own" on storage.objects;
create policy "bill_proofs_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid())
  with check (bucket_id = 'bill-proofs' and owner = auth.uid());

drop policy if exists "bill_proofs_delete_own" on storage.objects;
create policy "bill_proofs_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());
