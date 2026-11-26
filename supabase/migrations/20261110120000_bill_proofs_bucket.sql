-- Private storage bucket for bill proof uploads (Module 6).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bill-proofs', 'bill-proofs', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Owners upload into their own folder: <user_id>/<file>
drop policy if exists "bill_proofs_owner_insert" on storage.objects;
create policy "bill_proofs_owner_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'bill-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "bill_proofs_owner_select" on storage.objects;
create policy "bill_proofs_owner_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'bill-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "bill_proofs_owner_delete" on storage.objects;
create policy "bill_proofs_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'bill-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can read every proof to review submissions.
drop policy if exists "bill_proofs_admin_select" on storage.objects;
create policy "bill_proofs_admin_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'bill-proofs'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role::text = 'admin')
  );

-- Ensure the columns written by the submission service exist (idempotent).
alter table public.bills add column if not exists requester_id uuid references auth.users(id) on delete cascade;
alter table public.bills add column if not exists story text;
alter table public.bills add column if not exists biller_name text;
alter table public.bills add column if not exists amount_needed numeric;
alter table public.bills add column if not exists amount_raised numeric default 0;
alter table public.bills add column if not exists due_date date;
alter table public.bills add column if not exists proof_path text;
