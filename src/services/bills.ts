import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  BILL_CATEGORIES,
  type BillCategory,
  type BillStatus,
  type BillSubmissionErrors,
  type BillSubmissionInput,
  type SubmittedBill,
} from "@/types";

// The generated Database types may not yet include the new bill columns,
// so use an untyped view of the shared client for these queries.
const db = supabase as unknown as SupabaseClient;

export const PROOF_BUCKET = "bill-proofs";
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export const MIN_BILL_AMOUNT = 100;
export const MAX_BILL_AMOUNT = 50_000_000;

/** Parse a naira amount typed by the user ("250,000" -> 250000). Returns NaN when invalid. */
export function parseNairaAmount(value: string | number): number {
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[₦,\s]/g, "");
  if (cleaned === "" || !/^\d+(\.\d+)?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

function isCategory(value: string): value is BillCategory {
  return (BILL_CATEGORIES as readonly string[]).includes(value);
}

/** Validate the submission form. Returns an empty object when valid. */
export function validateBillSubmission(input: BillSubmissionInput): BillSubmissionErrors {
  const errors: BillSubmissionErrors = {};

  if (!input.title.trim()) errors.title = "Title is required";
  else if (input.title.trim().length > 120) errors.title = "Title must be 120 characters or fewer";

  if (!input.story.trim()) errors.story = "Story is required";
  else if (input.story.trim().length < 20) errors.story = "Story must be at least 20 characters";

  if (!input.category) errors.category = "Category is required";
  else if (!isCategory(input.category)) errors.category = "Choose a valid category";

  if (!input.billerName.trim()) errors.billerName = "Biller name is required";

  const amount = parseNairaAmount(input.amount);
  if (input.amount === "" || input.amount === null || input.amount === undefined) {
    errors.amount = "Amount is required";
  } else if (!Number.isFinite(amount) || amount < MIN_BILL_AMOUNT) {
    errors.amount = `Amount must be at least ₦${MIN_BILL_AMOUNT}`;
  } else if (amount > MAX_BILL_AMOUNT) {
    errors.amount = "Amount is too large";
  }

  if (!input.dueDate) errors.dueDate = "Due date is required";
  else if (Number.isNaN(new Date(input.dueDate).getTime())) errors.dueDate = "Enter a valid date";

  if (!input.proof) {
    errors.proof = "Proof of bill is required";
  } else if (!ACCEPTED_PROOF_TYPES.includes(input.proof.type)) {
    errors.proof = "Upload a JPG, PNG, WebP or PDF file";
  } else if (input.proof.size > MAX_PROOF_BYTES) {
    errors.proof = "File must be 5 MB or smaller";
  }

  return errors;
}

function safeFileName(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, "-").replace(/-+/g, "-");
  return base.slice(-80) || "proof";
}

/** Upload a proof file into the requester's private folder. Returns the storage path. */
export async function uploadBillProof(file: File, userId: string): Promise<string> {
  const path = `${userId}/${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await db.storage.from(PROOF_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Could not upload proof: ${error.message}`);
  return path;
}

type BillRow = Record<string, unknown>;

function toSubmittedBill(row: BillRow): SubmittedBill {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    story: String(row.story ?? ""),
    category: String(row.category ?? "Health") as BillCategory,
    billerName: String(row.biller_name ?? ""),
    amount: Number(row.amount_needed ?? 0),
    dueDate: String(row.due_date ?? ""),
    proofPath: String(row.proof_path ?? ""),
    status: String(row.status ?? "pending") as BillStatus,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export class BillValidationError extends Error {
  constructor(public readonly errors: BillSubmissionErrors) {
    super("Please fix the highlighted fields");
    this.name = "BillValidationError";
  }
}

/**
 * Validate, upload the proof and insert the bill with status "pending".
 * Requires a signed-in user. Cleans up the uploaded file if the insert fails.
 */
export async function submitBill(input: BillSubmissionInput): Promise<SubmittedBill> {
  const errors = validateBillSubmission(input);
  if (Object.keys(errors).length > 0) throw new BillValidationError(errors);

  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) throw new Error("Please sign in to submit a bill");
  const userId = auth.user.id;

  const proofPath = await uploadBillProof(input.proof as File, userId);

  const { data, error } = await db
    .from("bills")
    .insert({
      requester_id: userId,
      title: input.title.trim(),
      story: input.story.trim(),
      category: input.category,
      biller_name: input.billerName.trim(),
      amount_needed: parseNairaAmount(input.amount),
      amount_raised: 0,
      due_date: input.dueDate,
      proof_path: proofPath,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !data) {
    await db.storage.from(PROOF_BUCKET).remove([proofPath]).catch(() => undefined);
    throw new Error(error?.message ?? "Could not submit your bill. Please try again.");
  }

  return toSubmittedBill(data as BillRow);
}

/** Bills submitted by the current user, newest first. */
export async function fetchMyBills(): Promise<SubmittedBill[]> {
  const { data: auth } = await db.auth.getUser();
  if (!auth.user) return [];
  const { data, error } = await db
    .from("bills")
    .select("*")
    .eq("requester_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => toSubmittedBill(r as BillRow));
}
