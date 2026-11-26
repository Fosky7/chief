-- Enforce that an authenticated account can only create bill rows it owns.
--
-- Bill inserts previously accepted any owner column value, so a signed-in
-- account could create a row that looks like somebody else's bill. The guard
-- below rejects that insert while leaving service-role / server-side work
-- (auth.uid() is null) untouched.
--
-- Column names differ between schema iterations (user_id / requester_id /
-- owner_id / created_by / author_id), so the row is inspected through jsonb
-- instead of referencing columns that may not exist in every deployment.

create or replace function public.enforce_bill_ownership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  payload jsonb := to_jsonb(new);
  owner_key text;
  owner_val text;
begin
  -- Server-side / service-role writes are not attributable to a user session.
  if uid is null then
    return new;
  end if;

  foreach owner_key in array array[
    'user_id',
    'requester_id',
    'owner_id',
    'created_by',
    'author_id',
    'submitted_by'
  ] loop
    if payload ? owner_key then
      owner_val := payload ->> owner_key;
      if owner_val is not null and length(btrim(owner_val)) > 0 then
        if lower(btrim(owner_val)) <> lower(uid::text) then
          raise exception 'You can only create bills for your own account'
            using errcode = '42501';
        end if;
        return new;
      end if;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists bills_enforce_ownership on public.bills;

create trigger bills_enforce_ownership
before insert on public.bills
for each row execute function public.enforce_bill_ownership();
