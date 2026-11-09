import { supabase } from "@/integrations/supabase/client";

export interface AdminQueueBill {
  id: string;
  title: string;
  chamber: string | null;
  sponsor: string | null;
  status: string;
  summary: string | null;
  target_amount: number;
  raised_amount: number;
  created_at: string | null;
  submitted_by: string | null;
}

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeBill(row: any): AdminQueueBill {
  return {
    id: String(row?.id ?? ""),
    title: String(row?.title ?? "Untitled bill"),
    chamber: row?.chamber ?? null,
    sponsor: row?.sponsor ?? null,
    status: String(row?.status ?? "pending"),
    summary: row?.summary ?? null,
    target_amount: toNumber(row?.target_amount ?? row?.target ?? 0),
    raised_amount: toNumber(row?.raised_amount ?? row?.raised ?? 0),
    created_at: row?.created_at ?? null,
    submitted_by: row?.submitted_by ?? row?.user_id ?? null,
  };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return false;
  const user = data?.user;
  if (!user) return false;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return false;
  return String((profile as any)?.role ?? "").toLowerCase() === "admin";
}

export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizeBill);
}

async function setBillStatus(id: string, status: string): Promise<AdminQueueBill | null> {
  const { data, error } = await supabase
    .from("bills")
    .update({ status })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeBill(data) : null;
}

export async function approveBill(id: string): Promise<AdminQueueBill | null> {
  return setBillStatus(id, "approved");
}

export async function rejectBill(id: string): Promise<AdminQueueBill | null> {
  return setBillStatus(id, "rejected");
}

export async function markBillPaid(id: string): Promise<AdminQueueBill | null> {
  return setBillStatus(id, "paid");
}
