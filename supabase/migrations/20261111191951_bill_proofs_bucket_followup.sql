-- Follow-up to supabase/migrations/20250601000000_bill_proofs_bucket.sql, which is already live and stays unchanged.
-- Only the statements that were added or changed are applied here.

-- Module 6: private storage bucket for bill proof uploads.
-- Files are stored at <auth.uid()>/<timestamp>-<name> (see src/services/bills.ts).

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

create policy "bill_proofs_owner_or_admin_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'bill-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'admin'
      )
    )
  );
