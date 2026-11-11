import { supabase } from "@/integrations/supabase/client";

export const QUEUE_ERROR_MESSAGE =
  "Could not load the admin review queue. Please try again.";

export type AdminQueueStatus =
  | "pending"
  | "pending_review"
  | "submitted"
  | "approved"
  | "rejected"
  | "paid"
  | string;

export type AdminAction = "approve" | "reject" | "payout";

export interface AdminQueueBill {
  id: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  amount?: number;
  funded_amount?: number;
  fundedAmount?: number;
  status?: AdminQueueStatus;
  created_at?: string;
  createdAt?: string;
  creator_id?: string | null;
  creator_name?: string | null;
  creatorName?: string | null;
  reviewer_id?: string | null;
  reviewer_name?: string | null;
  reviewerName?: string | null;
  [key: string]: unknown;
}

export interface AdminFeedback {
  ok: boolean;
  message: string;
  [key: string]: unknown;
}

export interface AdminQueueSummary {
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  total: number;
}

function asNumber(value: unknown): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normaliseBill(row: Record<string, unknown>): AdminQueueBill {
  const createdAt = String(
    row.created_at ?? row.createdAt ?? new Date().toISOString(),
  );
  const funded = asNumber(
    row.funded_amount ?? row.fundedAmount ?? row.raised_amount,
  );

  return {
    ...row,
    id: String(row.id ?? ""),
    title: String(row.title ?? row.name ?? "Untitled bill"),
    description: row.description == null ? null : String(row.description),
    category: row.category == null ? null : String(row.category),
    amount: asNumber(row.amount ?? row.target_amount ?? row.total_amount),
    funded_amount: funded,
    fundedAmount: funded,
    status: String(row.status ?? "pending"),
    created_at: createdAt,
    createdAt,
    creator_id: row.creator_id
      ? String(row.creator_id)
      : row.user_id
        ? String(row.user_id)
        : null,
    creator_name: row.creator_name
      ? String(row.creator_name)
      : row.creatorName
        ? String(row.creatorName)
        : null,
    reviewer_id: row.reviewer_id ? String(row.reviewer_id) : null,
    reviewer_name: row.reviewer_name
      ? String(row.reviewer_name)
      : row.reviewerName
        ? String(row.reviewerName)
        : null,
  };
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return false;

    const user = data.user;
    const metadataRole =
      (user.app_metadata as Record<string, unknown> | undefined)?.role ??
      (user.user_metadata as Record<string, unknown> | undefined)?.role;

    if (metadataRole === "admin" || metadataRole === "reviewer") {
      return true;
    }

    const readRole = async (column: "user_id" | "id"): Promise<string | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq(column, user.id)
        .maybeSingle();

      if (error || !data) return null;
      return String((data as Record<string, unknown>).role ?? "").toLowerCase();
    };

    // profiles is keyed by `user_id` in this project while some older schemas
    // use `id`; check both so a real reviewer is never shut out of the queue.
    const roles = [await readRole("user_id"), await readRole("id")];
    return roles.some((role) => role === "admin" || role === "reviewer");
  } catch {
    return false;
  }
}

export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  let { data, error } = await supabase
    .from("bills")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(250);

  if (error) {
    const retry = await supabase.from("bills").select("*").limit(250);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    throw new Error(QUEUE_ERROR_MESSAGE);
  }

  return (data ?? []).map((row) => normaliseBill(row as Record<string, unknown>));
}

/**
 * Compatibility alias for screens that refer to the queue as a review queue.
 */
export async function fetchReviewQueue(): Promise<AdminQueueBill[]> {
  return fetchAdminQueue();
}

/**
 * Resolve the reviewer currently signed in. Returns the profile display name when
 * the connected backend exposes one, otherwise a safe fallback label.
 */
export async function resolveReviewer(
  userId?: string | null,
): Promise<{ id: string; name: string; role?: string | null } | null> {
  try {
    let id = userId ?? null;

    if (!id) {
      const { data } = await supabase.auth.getUser();
      id = data.user?.id ?? null;
    }

    if (!id) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return { id, name: "Reviewer" };
    }

    const row = data as Record<string, unknown>;
    return {
      id,
      name: String(
        row.full_name ?? row.display_name ?? row.name ?? row.email ?? "Reviewer",
      ),
      role: row.role == null ? null : String(row.role),
    };
  } catch {
    return null;
  }
}

function isMissingColumnError(
  error: { message?: string; code?: string } | null,
): boolean {
  if (!error) return false;
  const message = String(error.message ?? "").toLowerCase();
  return (
    error.code === "42703" ||
    message.includes("column") ||
    message.includes("schema cache")
  );
}

async function updateBillStatus(
  billId: string,
  status: string,
  note?: string,
): Promise<AdminFeedback> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const patch: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
  };

  if (user?.id) patch.reviewer_id = user.id;
  if (note) patch.review_note = note;

  let result = await supabase.from("bills").update(patch).eq("id", billId);

  if (result.error && isMissingColumnError(result.error)) {
    result = await supabase.from("bills").update({ status }).eq("id", billId);
  }

  if (result.error) {
    return {
      ok: false,
      message: result.error.message || QUEUE_ERROR_MESSAGE,
    };
  }

  return { ok: true, message: `Bill ${status}.` };
}

export async function approveBill(
  billId: string,
  note?: string,
): Promise<AdminFeedback> {
  return updateBillStatus(billId, "approved", note);
}

export async function rejectBill(
  billId: string,
  note?: string,
): Promise<AdminFeedback> {
  return updateBillStatus(billId, "rejected", note);
}

export async function payoutBill(
  billId: string,
  note?: string,
): Promise<AdminFeedback> {
  return updateBillStatus(billId, "paid", note);
}

export function summariseQueue(queue: AdminQueueBill[]): AdminQueueSummary {
  const summary: AdminQueueSummary = {
    pending: 0,
    approved: 0,
    rejected: 0,
    paid: 0,
    total: queue.length,
  };

  for (const bill of queue) {
    const status = String(bill.status ?? "").toLowerCase();
    if (status === "approved") summary.approved += 1;
    else if (status === "rejected") summary.rejected += 1;
    else if (status === "paid") summary.paid += 1;
    else summary.pending += 1;
  }

  return summary;
}
