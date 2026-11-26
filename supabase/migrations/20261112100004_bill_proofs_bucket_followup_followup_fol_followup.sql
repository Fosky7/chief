-- Follow-up to supabase/migrations/20261112100002_bill_proofs_bucket_followup_followup_followup.sql, which is already live and stays unchanged.
-- Only the statements that were added or changed are applied here.

-- Idempotent provisioning of the private "bill-proofs" storage bucket used by
-- the bill submission form (/bills/new) for the "Proof of bill" upload.
-- Safe to re-run: never deletes objects and never loosens visibility of an
-- existing bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bill-proofs',
  'bill-proofs',
  false,
  10485760,
  array['image/png','image/jpeg','image/jpg','image/webp','image/heic','application/pdf']
)
on conflict (id) do nothing;

-- Signed-in users may upload proof files; storage records them as the owner.
drop policy if exists "bill_proofs_insert_authenticated" on storage.objects;

create policy "bill_proofs_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bill-proofs' and auth.uid() is not null);

-- Uploaders can read their own proof files.
drop policy if exists "bill_proofs_select_owner" on storage.objects;

create policy "bill_proofs_select_owner"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());

-- Uploaders can replace their own proof files.
drop policy if exists "bill_proofs_update_owner" on storage.objects;

create policy "bill_proofs_update_owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid())
  with check (bucket_id = 'bill-proofs' and owner = auth.uid());

-- Uploaders can remove their own proof files.
drop policy if exists "bill_proofs_delete_owner" on storage.objects;

create policy "bill_proofs_delete_owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());
