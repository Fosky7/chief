-- Follow-up to supabase/migrations/20261112100002_bill_proofs_bucket_followup_followup_followup.sql, which is already live and stays unchanged.
-- Only the statements that were added or changed are applied here.

-- Ensure the private "bill-proofs" storage bucket exists with owner-scoped upload rules.
-- Idempotent: safe to run after earlier follow-up migrations.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bill-proofs',
  'bill-proofs',
  false,
  10485760,
  array['image/png','image/jpeg','image/webp','image/gif','application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'bill_proofs_owner_insert'
  ) then
    create policy bill_proofs_owner_insert on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'bill-proofs'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'bill_proofs_owner_select'
  ) then
    create policy bill_proofs_owner_select on storage.objects
      for select to authenticated
      using (
        bucket_id = 'bill-proofs'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'bill_proofs_owner_update'
  ) then
    create policy bill_proofs_owner_update on storage.objects
      for update to authenticated
      using (
        bucket_id = 'bill-proofs'
        and (storage.foldername(name))[1] = auth.uid()::text
      )
      with check (
        bucket_id = 'bill-proofs'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'bill_proofs_owner_delete'
  ) then
    create policy bill_proofs_owner_delete on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'bill-proofs'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;
end $$;
