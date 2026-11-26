-- Follow-up to supabase/migrations/20261112090001_bill_proofs_bucket_followup_followup.sql, which is already live and stays unchanged.
-- Only the statements that were added or changed are applied here.

create policy "bill_proofs_owner_or_admin_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'bill-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.bill_proofs_is_admin(auth.uid())
    )
  );
