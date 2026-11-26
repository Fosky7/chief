-- Storage bucket for bill proof uploads (idempotent)
insert into storage.buckets (id, name, public)
values ('bill-proofs', 'bill-proofs', true)
on conflict (id) do nothing;

drop policy if exists "bill_proofs_insert_authenticated" on storage.objects;
create policy "bill_proofs_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'bill-proofs' and owner = auth.uid());

drop policy if exists "bill_proofs_select_public" on storage.objects;
create policy "bill_proofs_select_public"
  on storage.objects for select
  using (bucket_id = 'bill-proofs');

drop policy if exists "bill_proofs_delete_owner" on storage.objects;
create policy "bill_proofs_delete_owner"
  on storage.objects for delete to authenticated
  using (bucket_id = 'bill-proofs' and owner = auth.uid());
