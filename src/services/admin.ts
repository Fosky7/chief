import { supabase } from "@/integrations/supabase/client";

export type BillStatus = "pending" | "approved" | "rejected" | "paid";

export interface AdminQueueBill {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  funded_amount: number;
  category: string | null;
  status: string;
  biller_name: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AdminDonation {
  id: string;
  bill_id: string;
  donor_id: string | null;
  amount: number;
  created_at: string;
  bill_title: string | null;
}

const BILL_COLUMNS =
  "id,title,description,amount,funded_amount,category,status,biller_name,created_by,created_at";

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBill(row: Record<string, unknown>): AdminQueueBill {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "Untitled bill"),
    description: (row.description as string | null) ?? null,
    amount: toNumber(row.amount),
    funded_amount: toNumber(row.funded_amount),
    category: (row.category as string | null) ?? null,
    status: String(row.status ?? "pending"),
    biller_name: (row.biller_name as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at ?? ""),
  };
}

/** Bills that still need an admin decision or a payout. */
export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  const { data, error } = await supabase
    .from("bills")
    .select(BILL_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => normalizeBill(row as Record<string, unknown>))
    .filter((bill) => bill.status !== "rejected" && bill.status !== "paid");
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) return false;
  return String((data as { role?: string } | null)?.role ?? "") === "admin";
}

async function updateBill(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("bills").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function approveBill(id: string): Promise<void> {
  await updateBill(id, {
    status: "approved",
    reviewed_at: new Date().toISOString(),
  });
}

export async function rejectBill(id: string): Promise<void> {
  await updateBill(id, {
    status: "rejected",
    reviewed_at: new Date().toISOString(),
  });
}

export async function markBillPaid(id: string): Promise<void> {
  await updateBill(id, {
    status: "paid",
    paid_at: new Date().toISOString(),
  });
}

/** Donations attached to approved/paid bills, for the admin payout view. */
export async function fetchApprovedDonations(): Promise<AdminDonation[]> {
  const withJoin = await supabase
    .from("donations")
    .select("id,bill_id,donor_id,amount,created_at,bills(title,status)")
    .order("created_at", { ascending: false });

  if (!withJoin.error) {
    return (withJoin.data ?? [])
      .map((row) => {
        const record = row as Record<string, unknown> & {
          bills?: { title?: string | null; status?: string | null } | null;
        };
        return {
          id: String(record.id ?? ""),
          bill_id: String(record.bill_id ?? ""),
          donor_id: (record.donor_id as string | null) ?? null,
          amount: toNumber(record.amount),
          created_at: String(record.created_at ?? ""),
          bill_title: record.bills?.title ?? null,
          bill_status: record.bills?.status ?? null,
        };
      })
      .filter(
        (donation) =>
          donation.bill_status === null ||
          donation.bill_status === undefined ||
          donation.bill_status === "approved" ||
          donation.bill_status === "paid",
      )
      .map(({ bill_status, ...donation }) => donation);
  }

  const plain = await supabase
    .from("donations")
    .select("id,bill_id,donor_id,amount,created_at")
    .order("created_at", { ascending: false });

  if (plain.error) return [];

  return (plain.data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    return {
      id: String(record.id ?? ""),
      bill_id: String(record.bill_id ?? ""),
      donor_id: (record.donor_id as string | null) ?? null,
      amount: toNumber(record.amount),
      created_at: String(record.created_at ?? ""),
      bill_title: null,
    };
  });
}
