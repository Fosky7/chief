-- Module 6: ensure the private bill-proofs bucket, its ownership rules and the
-- bill submission write path exist. Fully idempotent; safe to re-run.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('bill-proofs', 'bill-proofs', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Owners manage files only inside their own folder: <user_id>/<file>
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

-- Columns written by the submission service.
alter table public.bills add column if not exists requester_id uuid references auth.users(id) on delete cascade;
alter table public.bills add column if not exists story text;
alter table public.bills add column if not exists biller_name text;
alter table public.bills add column if not exists amount_needed numeric;
alter table public.bills add column if not exists amount_raised numeric default 0;
alter table public.bills add column if not exists due_date date;
alter table public.bills add column if not exists proof_path text;

-- Legacy columns from earlier modules must not block a submission that uses
-- the new column names. Owner-style uuid columns default to the caller.
do $$
declare
  c record;
begin
  for c in
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = 'bills'
  loop
    if c.column_name in ('user_id', 'created_by', 'submitted_by', 'owner_id')
       and c.data_type = 'uuid' and c.column_default is null then
      execute format('alter table public.bills alter column %I set default auth.uid()', c.column_name);
    elsif c.column_name in ('amount', 'goal', 'goal_amount', 'target_amount', 'biller', 'description', 'image_url', 'city')
       and c.is_nullable = 'NO' and c.column_default is null then
      execute format('alter table public.bills alter column %I drop not null', c.column_name);
    end if;
  end loop;
end $$;

-- Requesters may create their own bills (always pending) and read them back.
drop policy if exists "bills_requester_insert_own" on public.bills;
create policy "bills_requester_insert_own" on public.bills
  for insert to authenticated
  with check (requester_id = auth.uid() and status::text = 'pending');

drop policy if exists "bills_requester_select_own" on public.bills;
create policy "bills_requester_select_own" on public.bills
  for select to authenticated
  using (requester_id = auth.uid());
