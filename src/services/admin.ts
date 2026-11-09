import { supabase } from "@/integrations/supabase/client";

/**
 * Admin moderation data service (Module 5 — review & approval queue).
 *
 * Everything the /admin workspace needs from the backend lives here, so the
 * React layer only deals with a tidy, frontend-friendly shape:
 *
 *   - isCurrentUserAdmin()  → may the signed-in visitor moderate at all?
 *   - fetchAdminQueue()     → bills awaiting review + funded bills to pay out
 *   - approveBill() / rejectBill() / markBillPaid() → status writes
 *
 * The readers are deliberately tolerant: the bills table is read with
 * `select("*")` and money / photo / status values are normalised from the
 * column aliases actually seen in the schema, so a column rename never blanks
 * the moderation queue.
 */

const BILL_TABLE = "bills";

/** Upper bound on rows pulled into the moderation workspace per refresh. */
const BILL_QUERY_LIMIT = 200;

/** Statuses that still need a moderator's decision. */
const PENDING_STATUSES = new Set([
  "pending",
  "awaiting_review",
  "awaiting review",
  "under_review",
  "in_review",
  "submitted",
  "review",
]);

/** Statuses that mean the bill is live and can collect donations. */
const APPROVED_STATUSES = new Set(["approved", "live", "active", "published", "open"]);

/** Statuses that mean the biller has already been paid. */
const PAID_STATUSES = new Set([
  "paid",
  "paid_out",
  "paid out",
  "settled",
  "completed",
  "disbursed",
]);

/** Statuses that keep a bill out of the deck permanently. */
const REJECTED_STATUSES = new Set(["rejected", "declined", "hidden", "removed"]);

/** Profile role / flag values that grant moderation rights. */
const ADMIN_ROLES = new Set([
  "admin",
  "administrator",
  "moderator",
  "reviewer",
  "staff",
  "owner",
]);

/** Boolean profile flags that also grant moderation rights. */
const ADMIN_FLAGS = ["is_admin", "is_staff", "is_reviewer", "admin"] as const;

/** Flat keys that may carry the amount a bill needs. */
const GOAL_KEYS = [
  "goal",
  "goal_amount",
  "goalAmount",
  "needed",
  "needed_amount",
  "neededAmount",
  "amount_needed",
  "target_amount",
  "amount",
];

/** Flat keys that may carry the amount already raised. */
const RAISED_KEYS = [
  "raised",
  "raised_amount",
  "raisedAmount",
  "amount_raised",
  "funded_amount",
  "total_raised",
];

/** Flat keys that may carry a bill photo. */
const PHOTO_KEYS = [
  "photo_url",
  "photoUrl",
  "image_url",
  "imageUrl",
  "cover_image_url",
  "photo",
];

/** Relations that may be embedded on a bill row (requester profile). */
const REQUESTER_RELATIONS = ["profiles", "profile", "requester", "user", "owner"];

/** Name keys looked up inside an embedded requester profile. */
const NAME_KEYS = ["display_name", "full_name", "fullName", "name", "username", "email"];

export type BillStatus = "pending" | "approved" | "rejected" | "paid" | "unknown";

/** A single row rendered by the review queue or the payout queue. */
export type AdminQueueBill = {
  id: string;
  title: string;
  photoUrl: string | null;
  category: string | null;
  city: string | null;
  biller: string | null;
  dueDate: string | null;
  story: string | null;
  requesterName: string | null;
  raised: number;
  goal: number;
  status: BillStatus;
};

/** Everything the /admin page renders after one refresh. */
export type AdminQueue = {
  pending: AdminQueueBill[];
  funded: AdminQueueBill[];
};

type UnknownRow = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRow {
  return typeof value === "object" && value !== null && !Array.isArray(value) === true;
}

/** Parse a loose money value (number, numeric string, "₦250,000") to a number. */
function toAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "").trim();
    if (cleaned === "" || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickAmount(row: UnknownRow, keys: string[]): number | null {
  for (const key of keys) {
    const amount = toAmount(row[key]);
    if (amount !== null) return amount;
  }
  return null;
}

function pickText(row: UnknownRow, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return null;
}

/** Look for a requester name on the row itself or on an embedded profile. */
function pickRequesterName(row: UnknownRow): string | null {
  const flat = pickText(row, ["requester_name", "requesterName", "requester", "full_name", "display_name"]);
  if (flat) return flat;
  for (const relation of REQUESTER_RELATIONS) {
    const nested = row[relation];
    if (isRecord(nested)) {
      const name = pickText(nested, NAME_KEYS);
      if (name) return name;
      continue;
    }
    if (Array.isArray(nested) && nested.length > 0 && isRecord(nested[0])) {
      const name = pickText(nested[0], NAME_KEYS);
      if (name) return name;
    }
  }
  return null;
}

/** Normalise an ISO-ish due date; unknown formats are passed through. */
function normalizeDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Date(parsed).toISOString().slice(0, 10);
}

/**
 * Collapse the status vocabulary into the four states the UI cares about.
 * Rows with no recognisable status are treated as pending: an unlabelled bill
 * has not been reviewed yet, so a moderator must see it.
 */
export function normalizeStatus(value: unknown): BillStatus {
  if (typeof value !== "string") return "pending";
  const status = value.trim().toLowerCase();
  if (status === "") return "pending";
  if (PENDING_STATUSES.has(status)) return "pending";
  if (PAID_STATUSES.has(status)) return "paid";
  if (REJECTED_STATUSES.has(status)) return "rejected";
  if (APPROVED_STATUSES.has(status)) return "approved";
  return "unknown";
}

/** Convert one raw bills row into a renderable queue entry. */
export function mapBillRow(row: UnknownRow): AdminQueueBill | null {
  const rawId = row.id;
  const id =
    typeof rawId === "string" && rawId.trim() !== ""
      ? rawId.trim()
      : typeof rawId === "number"
        ? String(rawId)
        : null;
  if (!id) return null;

  const goal = pickAmount(row, GOAL_KEYS) ?? 0;
  const raised = pickAmount(row, RAISED_KEYS) ?? 0;

  return {
    id,
    title: pickText(row, ["title", "name", "bill_title"]) ?? "Untitled bill",
    photoUrl: pickText(row, PHOTO_KEYS),
    category: pickText(row, ["category", "category_name"]),
    city: pickText(row, ["city", "location", "state"]),
    biller: pickText(row, ["biller", "biller_name", "payee", "vendor"]),
    dueDate: normalizeDate(pickText(row, ["due_date", "dueDate", "due", "deadline"])),
    story: pickText(row, ["story", "description", "details", "note", "summary"]),
    requesterName: pickRequesterName(row),
    raised,
    goal,
    status: normalizeStatus(row.status ?? row.bill_status ?? row.state),
  };
}

/** Best-effort creation timestamp used only for ordering the queue. */
function rowTimestamp(row: UnknownRow): number {
  for (const key of ["created_at", "createdAt", "inserted_at", "updated_at", "created"]) {
    const value = row[key];
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

/** Read every bill row the signed-in visitor is allowed to see. */
async function fetchBillRows(): Promise<UnknownRow[]> {
  const { data, error } = await supabase.from(BILL_TABLE).select("*").limit(BILL_QUERY_LIMIT);
  if (error) {
    throw new Error(error.message || "Could not load bills for review.");
  }
  const rows = (data ?? []) as unknown as UnknownRow[];
  // Newest first so the freshest submissions sit at the top of the queue.
  return [...rows].sort((a, b) => rowTimestamp(b) - rowTimestamp(a));
}

/**
 * Load the whole moderation workspace in one round trip.
 *
 * `pending` holds bills still waiting for a decision; `funded` holds approved
 * bills that reached their goal and are ready to be paid out to the biller.
 */
export async function fetchAdminQueue(): Promise<AdminQueue> {
  const rows = await fetchBillRows();

  const pending: AdminQueueBill[] = [];
  const funded: AdminQueueBill[] = [];

  for (const row of rows) {
    const bill = mapBillRow(row);
    if (!bill) continue;

    if (bill.status === "pending") {
      pending.push(bill);
      continue;
    }

    if (bill.status === "approved" && bill.goal > 0 && bill.raised >= bill.goal) {
      funded.push(bill);
    }
  }

  return { pending, funded };
}

/** Only bills still awaiting a decision (cheaper call sites / future reuse). */
export async function fetchPendingBills(): Promise<AdminQueueBill[]> {
  const { pending } = await fetchAdminQueue();
  return pending;
}

/** Only approved bills that reached their goal. */
export async function fetchFundedBills(): Promise<AdminQueueBill[]> {
  const { funded } = await fetchAdminQueue();
  return funded;
}

/**
 * Write a new status onto a bill.
 *
 * The payload is cast so the call stays valid whether the generated database
 * types expose `status` as a free-form string or as a narrow enum union.
 */
async function updateBillStatus(id: string, status: string): Promise<void> {
  const patch = { status } as unknown as never;
  const { error } = await supabase.from(BILL_TABLE).update(patch).eq("id", id);
  if (error) {
    throw new Error(error.message || "Could not update the bill.");
  }
}

/** Approve a pending bill so it goes live in the swipe deck. */
export async function approveBill(id: string): Promise<void> {
  await updateBillStatus(id, "approved");
}

/** Reject a pending bill so it never reaches the deck. */
export async function rejectBill(id: string): Promise<void> {
  await updateBillStatus(id, "rejected");
}

/** Mark a fully funded bill as paid out to the biller. */
export async function markBillPaid(id: string): Promise<void> {
  await updateBillStatus(id, "paid");
}

/**
 * Does the given user hold a moderation role?
 *
 * The role may live in a dedicated `role` column or as a boolean flag on the
 * profile row, so the profile is read with `select("*")` and inspected rather
 * than projected, which keeps the check working across schema variations.
 * A missing row (or an RLS-denied read) simply means "not an admin".
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return false;

  const row = data as unknown as UnknownRow;

  for (const key of ["role", "account_role", "user_role", "app_role"]) {
    const value = row[key];
    if (typeof value === "string" && ADMIN_ROLES.has(value.trim().toLowerCase())) {
      return true;
    }
  }

  for (const flag of ADMIN_FLAGS) {
    if (row[flag] === true) return true;
  }

  return false;
}

/** Convenience wrapper: is the currently signed-in visitor an admin? */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return false;
  return isUserAdmin(data.user.id);
}
