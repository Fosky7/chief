/** Shared domain types for Chief. */

export const BILL_CATEGORIES = ["Education", "Health", "Housing", "Utilities"] as const;
export type BillCategory = (typeof BILL_CATEGORIES)[number];

export type BillStatus = "pending" | "approved" | "rejected" | "funded" | "paid";

/** Raw values collected by the bill submission form. */
export interface BillSubmissionInput {
  title: string;
  story: string;
  category: string;
  billerName: string;
  /** Amount in whole naira, as typed (may contain commas). */
  amount: string | number;
  /** ISO date string (yyyy-mm-dd). */
  dueDate: string;
  proof: File | null;
}

export type BillSubmissionField = keyof BillSubmissionInput;
export type BillSubmissionErrors = Partial<Record<BillSubmissionField, string>>;

/** A bill row as returned after a successful submission. */
export interface SubmittedBill {
  id: string;
  title: string;
  story: string;
  category: BillCategory;
  billerName: string;
  amount: number;
  dueDate: string;
  proofPath: string;
  status: BillStatus;
  createdAt: string;
}
