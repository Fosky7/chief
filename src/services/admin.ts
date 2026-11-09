import { supabase } from '@/integrations/supabase/client';

export type AdminQueueBill = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  fundedAmount: number;
  status: string;
  creatorId: string | null;
  createdAt: string | null;
  raw: Record<string, unknown>;
};

type BillRow = Record<string, unknown>;

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function pick(row: BillRow, keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

export function normalizeBill(row: BillRow | null | undefined): AdminQueueBill {
  const source = row ?? {};
  return {
    id: String(source.id ?? source.bill_id ?? ''),
    title: String(pick(source, ['title', 'name', 'bill_title']) ?? 'Untitled bill'),
    description: (pick(source, ['description', 'summary', 'details']) as string | null) ?? null,
    amount: asNumber(pick(source, ['amount', 'total_amount', 'target_amount'])),
    fundedAmount: asNumber(pick(source, ['funded_amount', 'raised_amount', 'amount_raised'])),
    status: String(source.status ?? 'pending'),
    creatorId: (pick(source, ['user_id', 'owner_id', 'creator_id', 'created_by']) as string | null) ?? null,
    createdAt: (pick(source, ['created_at', 'inserted_at']) as string | null) ?? null,
    raw: source,
  };
}

export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  const { data, error } = await supabase.from('bills').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as BillRow[]).map(normalizeBill);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return false;
  const userId = authData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (!profileError && String((profile as { role?: unknown } | null)?.role ?? '').toLowerCase() === 'admin') {
    return true;
  }

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (!rolesError && roles) {
    return roles.some((row) => String((row as { role?: unknown }).role ?? '').toLowerCase() === 'admin');
  }

  return false;
}

async function updateBillStatus(id: string, status: string): Promise<AdminQueueBill> {
  const { data, error } = await supabase
    .from('bills')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return normalizeBill(data as BillRow);
}

export function approveBill(id: string): Promise<AdminQueueBill> {
  return updateBillStatus(id, 'approved');
}

export function rejectBill(id: string): Promise<AdminQueueBill> {
  return updateBillStatus(id, 'rejected');
}

export function markBillPaid(id: string): Promise<AdminQueueBill> {
  return updateBillStatus(id, 'paid');
}
