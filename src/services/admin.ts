import { supabase } from "@/integrations/supabase/client";

export type AdminQueueBill = {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  status: string;
  biller_name?: string | null;
  due_date?: string | null;
  category?: string | null;
  funded_amount?: number | null;
  user_id?: string | null;
  created_at?: string | null;
};

export type AdminDonation = {
  id: string;
  bill_id: string;
  amount: number;
  status?: string | null;
  donor_name?: string | null;
  created_at?: string | null;
};

const QUEUE_STATUSES = [
  "pending",
  "pending_review",
  "Pending review",
  "Pending",
  "approved",
  "funded",
];

export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .in("status", QUEUE_STATUSES)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminQueueBill[];
}

export async function fetchApprovedDonations(): Promise<AdminDonation[]> {
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AdminDonation[];
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) return false;

  const userId = userData.user.id;

  const userRole = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!userRole.error && userRole.data) {
    const role = (userRole.data as Record<string, unknown>).role;
    if (typeof role === "string" && role.toLowerCase() === "admin") return true;
  }

  const profileRole = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profileRole.error && profileRole.data) {
    const role = (profileRole.data as Record<string, unknown>).role;
    if (typeof role === "string" && role.toLowerCase() === "admin") return true;
  }

  return false;
}

export async function approveBill(id: string): Promise<void> {
  const { error } = await supabase
    .from("bills")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function rejectBill(id: string): Promise<void> {
  const { error } = await supabase
    .from("bills")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function markBillPaid(id: string): Promise<void> {
  const { error } = await supabase
    .from("bills")
    .update({ status: "paid" })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
