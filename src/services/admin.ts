import { supabase } from "@/integrations/supabase/client";

/** Lifecycle states a bill can be in while moving through admin review. */
export type ReviewStatus = "pending" | "approved" | "rejected" | "funded" | "paid";

export interface ReviewBill {
  id: string;
  biller: string;
  submittedBy: string;
  amountCents: number;
  dueDate: string; // ISO date
  status: ReviewStatus;
}

export type Reviewer =
  | { kind: "admin"; email: string | null }
  | { kind: "visitor"; email: string | null };

/**
 * Sample review queue. Kept in memory only — it contains no real user data and
 * every page load starts from this seed again.
 */
const SEED: ReviewBill[] = [
  { id: "bill-1001", biller: "City Water", submittedBy: "ava@example.com", amountCents: 8450, dueDate: "2025-07-14", status: "pending" },
  { id: "bill-1002", biller: "Northside Electric", submittedBy: "liam@example.com", amountCents: 13299, dueDate: "2025-07-18", status: "pending" },
  { id: "bill-1003", biller: "Metro Internet", submittedBy: "noah@example.com", amountCents: 5999, dueDate: "2025-07-09", status: "funded" },
];

let store: ReviewBill[] = SEED.map((b) => ({ ...b }));

const clone = (): ReviewBill[] => store.map((b) => ({ ...b }));

function transition(id: string, allowedFrom: ReviewStatus[], to: ReviewStatus): ReviewBill {
  const bill = store.find((b) => b.id === id);
  if (!bill) throw new Error("Bill not found.");
  if (!allowedFrom.includes(bill.status)) {
    throw new Error(`This bill is ${bill.status} and cannot be changed to ${to}.`);
  }
  bill.status = to;
  return { ...bill };
}

/** Returns the current review queue (sample data). */
export async function fetchReviewQueue(): Promise<ReviewBill[]> {
  return clone();
}

export async function approveBill(id: string): Promise<ReviewBill> {
  return transition(id, ["pending"], "approved");
}

export async function rejectBill(id: string): Promise<ReviewBill> {
  return transition(id, ["pending"], "rejected");
}

export async function markPaidToBiller(id: string): Promise<ReviewBill> {
  return transition(id, ["funded"], "paid");
}

/** Restores the sample queue to its initial state. */
export function resetReviewQueue(): void {
  store = SEED.map((b) => ({ ...b }));
}

/**
 * Determines whether the signed-in user is an admin. Only server-controlled
 * app_metadata is trusted (user_metadata is user-editable).
 */
export async function resolveReviewer(): Promise<Reviewer> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return { kind: "visitor", email: null };
    const meta = (data.user.app_metadata ?? {}) as { role?: unknown; roles?: unknown };
    const isAdmin =
      meta.role === "admin" || (Array.isArray(meta.roles) && meta.roles.includes("admin"));
    return { kind: isAdmin ? "admin" : "visitor", email: data.user.email ?? null };
  } catch {
    return { kind: "visitor", email: null };
  }
}

export function formatAmount(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
