-- Follow-up to supabase/migrations/20261112100002_bill_proofs_bucket_followup_followup_followup.sql, which is already live and stays unchanged.
-- Only the statements that were added or changed are applied here.

-- Provision the private "bill-proofs" storage bucket used for proof-of-bill uploads.
-- Idempotent: safe to run even if earlier follow-up migrations partially applied.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bill-proofs',
  'bill-proofs',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Reset policies for this bucket so re-runs converge to one consistent set.
drop policy if exists "bill_proofs_insert_authenticated" on storage.objects;

drop policy if exists "bill_proofs_select_owner" on storage.objects;

drop policy if exists "bill_proofs_update_owner" on storage.objects;

drop policy if exists "bill_proofs_delete_owner" on storage.objects;

-- Signed-in users may upload proofs; the uploader becomes the object owner.
create policy "bill_proofs_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'bill-proofs' and auth.uid() is not null);

-- Only the uploader can read their own proofs.
create policy "bill_proofs_select_owner"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());

create policy "bill_proofs_update_owner"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid())
  with check (bucket_id = 'bill-proofs' and owner = auth.uid());

create policy "bill_proofs_delete_owner"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());
