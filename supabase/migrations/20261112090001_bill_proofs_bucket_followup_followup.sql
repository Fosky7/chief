-- Follow-up to supabase/migrations/20261111191951_bill_proofs_bucket_followup.sql, which is already live and stays unchanged.
-- Only the statements that were added or changed are applied here.

drop policy if exists "bill_proofs_owner_or_admin_select" on storage.objects;

create policy "bill_proofs_owner_or_admin_select"
  on storage.objects for select
  to authenticated
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
