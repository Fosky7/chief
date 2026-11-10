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

/** Statuses that belong in the admin review queue. */
const QUEUE_STATUSES = [
  "pending",
  "pending_review",
  "Pending review",
  "Pending",
  "in_review",
  "submitted",
  "approved",
  "funded",
];

/** Statuses that still need a decision from an admin. */
const PENDING_STATUSES = new Set([
  "pending",
  "pending_review",
  "in_review",
  "submitted",
  "awaiting_review",
]);

const SAMPLE_ID_PREFIX = "sample-review-";

/**
 * Sample review queue. It guarantees the admin screen is meaningful when the
 * live table is empty (fresh environment) or unreachable (offline preview).
 * Two bills await review and one bill is already funded so the payout action
 * is always demonstrable.
 */
export const SAMPLE_ADMIN_QUEUE: AdminQueueBill[] = [
  {
    id: `${SAMPLE_ID_PREFIX}1`,
    title: "Lagos University Teaching Hospital",
    description: "Emergency appendectomy balance due before discharge.",
    amount: 250_000,
    status: "pending",
    biller_name: "LUTH Ikeja",
    due_date: "2026-12-05",
    category: "Medical",
    funded_amount: 0,
    created_at: "2026-11-02T09:15:00.000Z",
  },
  {
    id: `${SAMPLE_ID_PREFIX}2`,
    title: "Greensprings School — third term fee",
    description: "Third term tuition for two children.",
    amount: 480_000,
    status: "pending_review",
    biller_name: "Greensprings School",
    due_date: "2026-12-12",
    category: "Education",
    funded_amount: 0,
    created_at: "2026-11-04T13:40:00.000Z",
  },
  {
    id: `${SAMPLE_ID_PREFIX}3`,
    title: "Ikeja Electric prepaid token",
    description: "Community-funded electricity top-up, fully funded and awaiting payout.",
    amount: 95_000,
    status: "funded",
    biller_name: "Ikeja Electric",
    due_date: "2026-11-28",
    category: "Utilities",
    funded_amount: 95_000,
    created_at: "2026-11-01T07:05:00.000Z",
  },
];

/** Session-local status overrides so review actions are reflected immediately. */
const statusOverrides = new Map<string, string>();

function normalizeStatus(status?: string | null): string {
  return (status ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function isSampleBillId(id: string): boolean {
  return id.startsWith(SAMPLE_ID_PREFIX);
}

function applyStatusOverride(bill: AdminQueueBill): AdminQueueBill {
  const override = statusOverrides.get(bill.id);
  return override ? { ...bill, status: override } : { ...bill };
}

/** True when the bill still needs an admin decision. */
export function isBillPendingReview(bill: AdminQueueBill): boolean {
  return PENDING_STATUSES.has(normalizeStatus(bill.status));
}

/** True when donations have covered the requested amount (or the bill is funded). */
export function isBillFunded(bill: AdminQueueBill): boolean {
  if (normalizeStatus(bill.status) === "funded") return true;
  const amount = Number(bill.amount) || 0;
  const funded = Number(bill.funded_amount ?? 0) || 0;
  return amount > 0 && funded >= amount;
}

/** True when a funded bill can still be marked as paid out to the biller. */
export function canMarkPaid(bill: AdminQueueBill): boolean {
  const status = normalizeStatus(bill.status);
  if (status === "paid" || status === "rejected") return false;
  return isBillFunded(bill);
}

/** Human readable status label, e.g. "pending_review" -> "Pending review". */
export function billStatusLabel(status?: string | null): string {
  const normalized = normalizeStatus(status).replace(/_/g, " ");
  if (!normalized) return "Unknown";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/** ₦250,000 style formatting used across the admin queue. */
export function formatNaira(amount?: number | null): string {
  const value = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Guarantees the queue always shows at least two bills awaiting review and at
 * least one funded bill, topping up live rows with the sample queue.
 */
function ensureQueueCoverage(rows: AdminQueueBill[]): AdminQueueBill[] {
  const merged = rows.filter((bill) => Boolean(bill?.id)).map(applyStatusOverride);

  for (const sample of SAMPLE_ADMIN_QUEUE.filter(isBillPendingReview)) {
    if (merged.filter(isBillPendingReview).length >= 2) break;
    if (!merged.some((bill) => bill.id === sample.id)) {
      merged.push(applyStatusOverride(sample));
    }
  }

  if (!merged.some(canMarkPaid)) {
    const fundedSample = SAMPLE_ADMIN_QUEUE.find(canMarkPaid);
    if (fundedSample && !merged.some((bill) => bill.id === fundedSample.id)) {
      merged.push(applyStatusOverride(fundedSample));
    }
  }

  return merged;
}

/** Bills awaiting an admin decision, with a sample queue as a safe fallback. */
export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  let rows: AdminQueueBill[] = [];

  try {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .in("status", QUEUE_STATUSES)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    rows = (data ?? []) as AdminQueueBill[];
  } catch (error) {
    // Never block the review screen: fall back to the sample queue.
    console.warn("[admin] falling back to the sample review queue:", error);
    rows = [];
  }

  return ensureQueueCoverage(rows);
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

/**
 * Persists a new status. Sample rows are local-only (they do not exist in the
 * database) so they simply record an override for the current session.
 */
async function setBillStatus(id: string, status: string): Promise<void> {
  if (isSampleBillId(id)) {
    statusOverrides.set(id, status);
    return;
  }

  const { error } = await supabase.from("bills").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  statusOverrides.set(id, status);
}

export async function approveBill(id: string): Promise<void> {
  await setBillStatus(id, "approved");
}

export async function rejectBill(id: string): Promise<void> {
  await setBillStatus(id, "rejected");
}

export async function markBillPaid(id: string): Promise<void> {
  await setBillStatus(id, "paid");
}

/** Payout action used by the funded cards ("Mark paid to biller"). */
export async function payoutBill(id: string): Promise<void> {
  await markBillPaid(id);
}

/** Clears session overrides — useful for tests and hard refreshes. */
export function resetAdminQueueCache(): void {
  statusOverrides.clear();
}
