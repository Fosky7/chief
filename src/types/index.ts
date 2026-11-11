/**
 * Shared domain types for Chief.
 *
 * These describe the shapes that travel between the Supabase tables, the
 * service layer (src/services/*) and the screens that render them. They are
 * intentionally permissive where the backend column is free-form (status) and
 * strict where the UI depends on a value (ids, amounts).
 */

/** How someone uses Chief. */
export type UserRole = "donor" | "bill_requester" | "admin";

/**
 * Status values Chief knows how to render. A row may still carry an unknown
 * value, so persisted records keep `status: string`; this union is what the
 * review actions write.
 */
export type BillStatus =
  | "pending"
  | "pending_review"
  | "in_review"
  | "submitted"
  | "awaiting_review"
  | "approved"
  | "rejected"
  | "funded"
  | "paid"
  | "cancelled";

/** A bill as stored in the `bills` table. */
export interface Bill {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  biller_name: string | null;
  amount: number;
  funded_amount: number;
  status: string;
  due_date: string | null;
  created_at?: string | null;
}

/**
 * A bill normalised for the admin review queue.
 *
 * Amounts are always numbers (never formatted strings) so the queue can sum
 * them, and the optional columns collapse to `null` instead of `undefined` so
 * React never renders "undefined" into a card.
 */
export interface AdminQueueBill {
  id: string;
  title: string;
  biller_name: string | null;
  category: string | null;
  description: string | null;
  due_date: string | null;
  amount: number;
  funded_amount: number;
  status: string;
}

/** The three decisions an admin can make on a queued bill. */
export type AdminAction = "approve" | "reject" | "payout";

/** Tone used when surfacing the outcome of a review action. */
export type AdminFeedbackTone = "success" | "error";

/** Feedback banner shown above the admin queue. */
export interface AdminFeedback {
  message: string;
  tone: AdminFeedbackTone;
}

/** Aggregate figures shown at the top of the review queue. */
export interface AdminQueueSummary {
  pending: number;
  funded: number;
  total: number;
}

/** A member profile. */
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
}
