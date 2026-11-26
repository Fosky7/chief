-- Ensure the bill-proofs storage bucket exists (idempotent; preserves existing bucket settings and files).
insert into storage.buckets (id, name, public)
values ('bill-proofs', 'bill-proofs', true)
on conflict (id) do nothing;

-- Uploads: any signed-in user may upload proof files into the bucket; storage records them as the owner.
drop policy if exists "bill_proofs_insert_authenticated" on storage.objects;
create policy "bill_proofs_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bill-proofs' and auth.uid() is not null);

-- Reads through the API: owners can list/read their own proofs (public URLs serve reviewers).
drop policy if exists "bill_proofs_select_owner" on storage.objects;
create policy "bill_proofs_select_owner"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());

-- Only the uploader may replace or remove their own proof.
drop policy if exists "bill_proofs_update_owner" on storage.objects;
create policy "bill_proofs_update_owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid())
  with check (bucket_id = 'bill-proofs' and owner = auth.uid());

drop policy if exists "bill_proofs_delete_owner" on storage.objects;
create policy "bill_proofs_delete_owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());
