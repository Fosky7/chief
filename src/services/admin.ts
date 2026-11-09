import { supabase } from "@/integrations/supabase/client";

export type AdminQueueBill = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  ownerId: string | null;
  createdAt: string | null;
};

export type AdminDonation = {
  id: string;
  billId: string;
  donorId: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  createdAt: string | null;
  billTitle: string | null;
};

function asNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeBill(row: Record<string, any>): AdminQueueBill {
  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled bill"),
    description: row.description ?? null,
    amount: asNumber(row.amount),
    status: String(row.status ?? "pending"),
    ownerId: row.owner_id ?? row.ownerId ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
  };
}

function normalizeDonation(row: Record<string, any>): AdminDonation {
  const billRelation = row.bills ?? row.bill;
  return {
    id: String(row.id),
    billId: String(row.bill_id ?? row.billId ?? ""),
    donorId: String(row.donor_id ?? row.donorId ?? ""),
    amount: asNumber(row.amount),
    status: (row.status ?? "pending") as AdminDonation["status"],
    note: row.note ?? null,
    createdAt: row.created_at ?? row.createdAt ?? null,
    billTitle: billRelation?.title ?? row.bill_title ?? null,
  };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (error) return false;
  return data?.role === "admin";
}

export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeBill);
}

async function updateBillStatus(id: string, status: string): Promise<AdminQueueBill> {
  const { data, error } = await supabase
    .from("bills")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return normalizeBill(data);
}

export const approveBill = (id: string) => updateBillStatus(id, "approved");
export const rejectBill = (id: string) => updateBillStatus(id, "rejected");
export const markBillPaid = (id: string) => updateBillStatus(id, "paid");

export async function fetchPendingDonations(): Promise<AdminDonation[]> {
  const { data, error } = await supabase
    .from("donations")
    .select("*, bills(title)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeDonation);
}

export async function updateDonationStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<AdminDonation> {
  const { data, error } = await supabase
    .from("donations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, bills(title)")
    .single();

  if (error) throw error;
  return normalizeDonation(data);
}

export async function fetchApprovedDonations(donorId: string): Promise<AdminDonation[]> {
  const { data, error } = await supabase
    .from("donations")
    .select("*, bills(title)")
    .eq("donor_id", donorId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeDonation);
}
