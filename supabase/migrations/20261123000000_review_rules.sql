-- Review rules: rejection reasons and a single owner resubmission.
alter table public.bills
  add column if not exists rejection_reason text,
  add column if not exists rejected_at timestamptz,
  add column if not exists resubmission_count integer not null default 0,
  add column if not exists last_resubmitted_at timestamptz,
  add column if not exists proof_files jsonb not null default '[]'::jsonb;

alter table public.bills drop constraint if exists bills_resubmission_count_range;
alter table public.bills
  add constraint bills_resubmission_count_range
  check (resubmission_count >= 0 and resubmission_count <= 1);

alter table public.bills drop constraint if exists bills_proof_files_max_three;
alter table public.bills
  add constraint bills_proof_files_max_three
  check (
    proof_files is not null
    and jsonb_typeof(proof_files) = 'array'
    and jsonb_array_length(proof_files) <= 3
  );

alter table public.bills drop constraint if exists bills_rejected_requires_reason;
alter table public.bills
  add constraint bills_rejected_requires_reason
  check (
    coalesce(status, '') <> 'rejected'
    or (rejection_reason is not null and btrim(rejection_reason) <> '')
  ) not valid;

create index if not exists bills_rejected_status_idx
  on public.bills (status)
  where status = 'rejected';

comment on column public.bills.rejection_reason is 'Admin-provided reason shown to the bill owner after rejection.';
comment on column public.bills.rejected_at is 'When an admin last rejected this bill.';
comment on column public.bills.resubmission_count is 'Number of owner resubmissions. The review rules allow exactly one.';
comment on column public.bills.last_resubmitted_at is 'When the owner last resent this bill for review.';
comment on column public.bills.proof_files is 'Up to three proof files attached to the bill.';
