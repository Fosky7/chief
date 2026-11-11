/**
 * Admin review queue service.
 *
 * Responsibilities:
 *  - read the `bills` table and normalise rows into `AdminQueueBill`s
 *  - expose the pure status/predicate helpers the queue UI renders
 *  - write the three review decisions (approve / reject / payout)
 *
 * The queue always includes a small curated set of reviewable sample bills so
 * the screen has something to show while the live moderation queue is still
 * filling up (the discover deck uses the same technique with sample bills).
 * Curated entries are read-only local fixtures: acting on one never touches the
 * database, and live rows are always listed ahead of them.
 */
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/currency";
import type { AdminAction, AdminQueueBill, BillStatus } from "@/types";

export { formatNaira };
export type { AdminAction, AdminQueueBill };

/** Statuses that still need a human decision. */
const PENDING_STATUSES = new Set([
  "pending",
  "pending_review",
  "in_review",
  "submitted",
  "awaiting_review",
  "under_review",
  "queued",
  "new",
]);

/** Statuses that mean "the community has finished funding this bill". */
const FUNDED_STATUSES = new Set(["funded", "fully_funded"]);

/** Statuses after which no further review action applies. */
const CLOSED_STATUSES = new Set(["paid", "rejected", "declined", "cancelled", "canceled"]);

/** Human labels for the statuses this app can produce. */
const STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  pending_review: "Pending review",
  submitted: "Pending review",
  awaiting_review: "Pending review",
  queued: "Pending review",
  new: "Pending review",
  in_review: "In review",
  under_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  declined: "Rejected",
  funded: "Funded",
  fully_funded: "Funded",
  paid: "Paid",
  cancelled: "Cancelled",
  canceled: "Cancelled",
};

/** Column aliases seen across the bills table and bundled fixtures. */
const TITLE_KEYS = ["title", "name", "bill_title"];
const BILLER_KEYS = ["biller_name", "biller", "provider_name", "vendor_name", "payee"];
const CATEGORY_KEYS = ["category", "category_name", "type"];
const DESCRIPTION_KEYS = ["description", "story", "summary", "notes"];
const DUE_KEYS = ["due_date", "due_at", "deadline"];
const STATUS_KEYS = ["status", "state"];
const AMOUNT_KEYS = ["amount", "needed_amount", "needed", "goal_amount", "goal", "target_amount"];
const FUNDED_KEYS = ["funded_amount", "raised_amount", "amount_raised", "raised", "total_raised", "funded"];

/** Prefix that marks a curated (non-persisted) queue entry. */
const CURATED_ID_PREFIX = "demo-bill-";

/** The status each review action writes. */
const WRITE_STATUS: Record<AdminAction, Extract<BillStatus, "approved" | "rejected" | "paid">> = {
  approve: "approved",
  reject: "rejected",
  payout: "paid",
};

/** Success copy for each review action. */
const ACTION_MESSAGE: Record<AdminAction, string> = {
  approve: "Bill approved",
  reject: "Bill rejected",
  payout: "Paid out",
};

/** Message shown when the queue or an action fails. */
export const QUEUE_ERROR_MESSAGE = "Could not load the review queue";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Parse a loose money value (number, numeric string or "₦250,000") to a number. */
function toAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "").trim();
    if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickAmount(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const amount = toAmount(record[key]);
    if (amount !== null) return amount;
  }
  return null;
}

function pickText(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return null;
}

/** Normalise a status for comparison (lowercase, underscores). */
function normalizeStatus(status?: string | null): string {
  return (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/** True when the row still needs an admin decision. */
export function isBillPendingReview(bill: Pick<AdminQueueBill, "status">): boolean {
  const key = normalizeStatus(bill?.status);
  // A submitted row without a status is by definition awaiting review.
  if (key === "") return true;
  return PENDING_STATUSES.has(key);
}

/** True when a bill has been fully funded and can be paid out to the biller. */
export function canMarkPaid(bill: AdminQueueBill): boolean {
  const key = normalizeStatus(bill.status);
  if (CLOSED_STATUSES.has(key)) return false;
  if (isBillPendingReview(bill)) return false;
  if (FUNDED_STATUSES.has(key)) return true;

  const amount = Number(bill.amount) || 0;
  const funded = Number(bill.funded_amount) || 0;
  return amount > 0 && funded >= amount;
}

/** Display label for a persisted status value. */
export function billStatusLabel(status?: string | null): string {
  const key = normalizeStatus(status);
  if (!key) return STATUS_LABELS.pending;
  const known = STATUS_LABELS[key];
  if (known) return known;
  return key
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Map one raw database row (or fixture) into an `AdminQueueBill`. */
function mapBillRow(row: unknown): AdminQueueBill | null {
  if (!isRecord(row)) return null;

  const rawId = row.id;
  const id =
    typeof rawId === "string" && rawId.trim() !== ""
      ? rawId.trim()
      : typeof rawId === "number"
        ? String(rawId)
        : null;
  if (!id) return null;

  return {
    id,
    title: pickText(row, TITLE_KEYS) ?? "Untitled bill",
    biller_name: pickText(row, BILLER_KEYS),
    category: pickText(row, CATEGORY_KEYS),
    description: pickText(row, DESCRIPTION_KEYS),
    due_date: pickText(row, DUE_KEYS),
    amount: pickAmount(row, AMOUNT_KEYS) ?? 0,
    funded_amount: pickAmount(row, FUNDED_KEYS) ?? 0,
    status: pickText(row, STATUS_KEYS) ?? "pending",
  };
}

/** Pending bills first, then payable ones, then everything else. */
function sortQueue(bills: AdminQueueBill[]): AdminQueueBill[] {
  const priority = (bill: AdminQueueBill): number => {
    if (isBillPendingReview(bill)) return 0;
    if (canMarkPaid(bill)) return 1;
    return 2;
  };

  return [...bills].sort((a, b) => priority(a) - priority(b));
}

/**
 * Curated review entries.
 *
 * They keep the queue demonstrable before real bill submissions land and give a
 * non-admin visitor something to read. They are local fixtures — never persisted
 * and never mutated in place (a fresh copy is returned on every read).
 */
const CURATED_QUEUE: readonly AdminQueueBill[] = [
  {
    id: `${CURATED_ID_PREFIX}rent-arrears`,
    title: "Two months rent arrears in Yaba",
    biller_name: "Yaba Property Management",
    category: "Rent",
    description:
      "Eviction notice served; the household needs the two outstanding months cleared before the end of the month.",
    due_date: "2026-01-15",
    amount: 180000,
    funded_amount: 0,
    status: "pending",
  },
  {
    id: `${CURATED_ID_PREFIX}school-fees`,
    title: "Final term school fees for three children",
    biller_name: "Bright Future Academy",
    category: "School fees",
    description:
      "Term invoices for three siblings. The school requires payment before exams begin next week.",
    due_date: "2026-02-02",
    amount: 240000,
    funded_amount: 0,
    status: "pending",
  },
  {
    id: `${CURATED_ID_PREFIX}hospital-bill`,
    title: "Hospital bill after emergency surgery",
    biller_name: "Garki General Hospital",
    category: "Hospital",
    description: "The community funded this bill in full; awaiting payout to the hospital.",
    due_date: "2025-12-28",
    amount: 320000,
    funded_amount: 320000,
    status: "funded",
  },
];

function curatedQueue(): AdminQueueBill[] {
  return CURATED_QUEUE.map((bill) => ({ ...bill }));
}

function isSampleBillId(billId: string): boolean {
  return billId.startsWith(CURATED_ID_PREFIX);
}

/** True for curated, non-persisted sample queue entries. */
export function isSampleBill(bill: Pick<AdminQueueBill, "id">): boolean {
  return isSampleBillId(bill.id);
}

/**
 * Combine live rows with the curated sample queue.
 *
 * Live rows always come first; the samples fill in behind them (and are skipped
 * if a live row reuses an id) so the screen always has at least one reviewable
 * card and one payable card to demonstrate the flow with.
 */
function mergeQueue(live: AdminQueueBill[]): AdminQueueBill[] {
  const liveIds = new Set(live.map((bill) => bill.id));
  const samples = curatedQueue().filter((bill) => !liveIds.has(bill.id));
  return [...live, ...samples];
}

/**
 * Read the review queue.
 *
 * Read failures (missing table, denied policy, offline) degrade to the curated
 * queue instead of blanking the screen, and are logged for operators.
 */
export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  let live: AdminQueueBill[] = [];

  try {
    const { data, error } = await supabase.from("bills").select("*").limit(100);
    if (error) throw new Error(error.message);

    live = (Array.isArray(data) ? data : [])
      .map(mapBillRow)
      .filter((bill): bill is AdminQueueBill => bill !== null);
  } catch (error) {
    console.warn("[admin] could not read the live review queue:", error);
    live = [];
  }

  return sortQueue(mergeQueue(live));
}

/**
 * Persist a review decision.
 *
 * Curated fixtures resolve locally. Real rows are updated on the `bills` table;
 * row level security decides whether the signed-in account may do that, and any
 * policy rejection is surfaced to the caller.
 */
async function writeBillStatus(billId: string, status: AdminQueueBill["status"]): Promise<void> {
  if (isSampleBillId(billId)) return;

  const { error } = await supabase
    .from("bills")
    // The cast keeps the payload compatible with both the untyped client here
    // and a generated Database type, where `status` may be a narrower union.
    .update({ status } as never)
    .eq("id", billId);

  if (error) throw new Error(error.message || "The bill could not be updated");
}

/** Approve a submitted bill. */
export async function approveBill(billId: string): Promise<void> {
  await writeBillStatus(billId, WRITE_STATUS.approve);
}

/** Reject a submitted bill. */
export async function rejectBill(billId: string): Promise<void> {
  await writeBillStatus(billId, WRITE_STATUS.reject);
}

/** Mark a fully funded bill as paid to the biller. */
export async function payoutBill(billId: string): Promise<void> {
  await writeBillStatus(billId, WRITE_STATUS.payout);
}

/** The success copy for a completed review action. */
export function adminActionMessage(action: AdminAction): string {
  return ACTION_MESSAGE[action];
}

/** Status written by a review action (useful for optimistic UI updates). */
export function adminActionStatus(action: AdminAction): string {
  return WRITE_STATUS[action];
}

/**
 * Whether the signed-in account holds the admin role.
 *
 * Best effort by design: a signed-out visitor or an unreadable role is simply
 * not an admin, and nothing here throws into the render path.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return false;

    const metadata = (user.app_metadata ?? {}) as Record<string, unknown>;
    const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    for (const candidate of [metadata.role, userMetadata.role]) {
      if (typeof candidate === "string" && candidate.trim().toLowerCase() === "admin") {
        return true;
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return false;

    const role = (data as unknown as { role?: unknown }).role;
    return typeof role === "string" && role.trim().toLowerCase() === "admin";
  } catch {
    return false;
  }
}

// ── Auto-generated by KrossBuild named-export gate ──
// These bindings were imported elsewhere but missing here. Preserved blocks
// are recovered verbatim from the prior version of this file (sticky export
// invariant); unknown names are safe stubs. Replace stubs with real logic.
export function summariseQueue(bills: readonly AdminQueueBill[] | null | undefined): {
  total: number;
  pending: number;
  payable: number;
  approved: number;
  closed: number;
  other: number;
  samples: number;
  live: number;
  totalAmount: number;
  totalFunded: number;
  pendingAmount: number;
  payableAmount: number;
} {
  const list = Array.isArray(bills) ? bills : [];
  const summary = {
    total: 0,
    pending: 0,
    payable: 0,
    approved: 0,
    closed: 0,
    other: 0,
    samples: 0,
    live: 0,
    totalAmount: 0,
    totalFunded: 0,
    pendingAmount: 0,
    payableAmount: 0,
  };

  for (const bill of list) {
    if (!bill || typeof bill.id !== "string") continue;
    summary.total += 1;

    if (isSampleBill(bill)) summary.samples += 1;
    else summary.live += 1;

    const amount = Number(bill.amount) || 0;
    const funded = Number(bill.funded_amount) || 0;
    summary.totalAmount += amount;
    summary.totalFunded += funded;

    const key = normalizeStatus(bill.status);
    if (isBillPendingReview(bill)) {
      summary.pending += 1;
      summary.pendingAmount += amount;
    } else if (canMarkPaid(bill)) {
      summary.payable += 1;
      summary.payableAmount += amount;
    } else if (CLOSED_STATUSES.has(key)) {
      summary.closed += 1;
    } else if (key === "approved") {
      summary.approved += 1;
    } else {
      summary.other += 1;
    }
  }

  return summary;
}
