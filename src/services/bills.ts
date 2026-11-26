import { supabase } from "@/integrations/supabase/client";
import {
  MAX_PROOF_FILES,
  normalizeProofFiles,
  proofSelectionError,
  rejectionStateOf,
  type ProofFileRef,
} from "@/types";

export const BILL_PROOFS_BUCKET = "bill-proofs";

export interface NewBillInput {
  title: string;
  story: string;
  category: string;
  billerName: string;
  amount: number | string;
  dueDate: string;
  /** Legacy single proof file; read as a one-item list when `proofFiles` is absent. */
  proofFile?: File | null;
  /** Up to three proof files, 5 MB each. */
  proofFiles?: File[];
}

export type NewBillErrors = Partial<Record<keyof NewBillInput, string>>;

export interface SavedBill {
  id: string;
  title: string;
  status: "pending";
  proofUrl: string;
  proofFiles: ProofFileRef[];
  amount: number;
}

/** Selected proof files, mixing the legacy single field with the new list. */
export function proofFilesOf(input: Pick<NewBillInput, "proofFile" | "proofFiles">): File[] {
  if (Array.isArray(input.proofFiles) && input.proofFiles.length > 0) {
    return input.proofFiles.slice(0, MAX_PROOF_FILES);
  }
  return input.proofFile ? [input.proofFile] : [];
}

/** Parse a naira amount typed by a user, e.g. "₦250,000" -> 250000. */
export function parseNairaAmount(value: number | string): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return NaN;
  return Number(cleaned);
}

/** Format a typed amount as naira, e.g. 250000 -> "₦250,000". */
export function formatNairaInput(value: number | string): string {
  const n = parseNairaAmount(value);
  if (!Number.isFinite(n)) return "";
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export function validateBill(input: NewBillInput): NewBillErrors {
  const errors: NewBillErrors = {};
  if (!input.title?.trim()) errors.title = "Title is required";
  if (!input.story?.trim()) errors.story = "Story is required";
  if (!input.category?.trim()) errors.category = "Category is required";
  if (!input.billerName?.trim()) errors.billerName = "Biller name is required";
  const amount = parseNairaAmount(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Enter an amount greater than ₦0";
  if (!input.dueDate) errors.dueDate = "Due date is required";
  const files = proofFilesOf(input);
  if (files.length === 0) {
    errors.proofFile = "Proof of bill is required";
  } else {
    const problem = proofSelectionError(files);
    if (problem) errors.proofFiles = problem;
  }
  return errors;
}

export class BillValidationError extends Error {
  errors: NewBillErrors;
  constructor(errors: NewBillErrors) {
    super("Please fix the highlighted fields");
    this.errors = errors;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export async function uploadBillProof(file: File, userId: string | null): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId ?? "anonymous"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  // Never let a slow/unavailable storage bucket block the bill insert.
  const { error } = (await withTimeout(
    Promise.resolve(
      db.storage.from(BILL_PROOFS_BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false }),
    ) as Promise<{ error: { message: string } | null }>,
    8000,
    { error: { message: "Upload timed out" } },
  )) as { error: { message: string } | null };
  if (error) {
    // Storage unavailable: keep small proofs inline so review can still see them.
    if (file.size <= 1.5 * 1024 * 1024) return await fileToDataUrl(file);
    throw new Error(`Proof upload failed: ${error.message}`);
  }
  const { data } = db.storage.from(BILL_PROOFS_BUCKET).getPublicUrl(path);
  return (data?.publicUrl as string) || path;
}

/** Uploads every selected proof file and returns their stored references. */
export async function uploadBillProofs(files: File[], userId: string | null): Promise<ProofFileRef[]> {
  const problem = proofSelectionError(files);
  if (problem) throw new Error(problem);
  const stored: ProofFileRef[] = [];
  for (const file of files) {
    const url = await uploadBillProof(file, userId);
    stored.push({ url, name: file.name, size: file.size, type: file.type || "" });
  }
  return stored;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the proof file"));
    reader.readAsDataURL(file);
  });
}

const CATEGORY_GROUPS: Record<string, string> = {
  electricity: "Utilities",
  water: "Utilities",
  internet: "Utilities",
  utilities: "Utilities",
  rent: "Housing",
  housing: "Housing",
  "school fees": "Education",
  education: "Education",
  medical: "Health",
  health: "Health",
};

/** Ordered spellings to try for a category the database may constrain. */
function categoryCandidates(category: string): string[] {
  const base = category.trim();
  const snake = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const group = CATEGORY_GROUPS[base.toLowerCase()] ?? base;
  const list = [
    base,
    base.toLowerCase(),
    snake(base),
    group,
    group.toLowerCase(),
    base.toLowerCase() === "medical" ? "hospital" : "",
    "Other",
    "other",
  ].filter(Boolean);
  return Array.from(new Set(list));
}

export async function submitBill(input: NewBillInput): Promise<SavedBill> {
  const errors = validateBill(input);
  if (Object.keys(errors).length > 0) throw new BillValidationError(errors);

  const { data: sessionData } = await db.auth.getSession();
  let userId: string | null = sessionData?.session?.user?.id ?? null;
  if (!userId) {
    const { data: userData } = await db.auth.getUser();
    userId = userData?.user?.id ?? null;
  }
  if (!userId) throw new Error("Please sign in to submit a bill");

  const uploaded = await uploadBillProofs(proofFilesOf(input), userId);
  const proofUrl = uploaded[0]?.url ?? "";
  const amount = parseNairaAmount(input.amount);

  const title = input.title.trim();
  const story = input.story.trim();
  const billerName = input.billerName.trim();
  // Common column names; any the table lacks are dropped and the insert retried.
  const row: Record<string, unknown> = {
    title,
    story,
    description: story,
    category: input.category,
    biller_name: billerName,
    biller: billerName,
    amount,
    goal: amount,
    due_date: input.dueDate,
    proof_url: proofUrl,
    proof_files: uploaded,
    status: "pending",
    user_id: userId,
    requester_id: userId,
  };

  // Values for alternative column names a NOT NULL column might use.
  const aliases: Record<string, unknown> = {
    amount_needed: amount,
    goal_amount: amount,
    target_amount: amount,
    amount_goal: amount,
    amount_requested: amount,
    proof_path: proofUrl,
    proof_image_url: proofUrl,
    invoice_url: proofUrl,
    biller_account: billerName,
    payee: billerName,
    owner_id: userId,
    created_by: userId,
    summary: story,
  };
  const categories = categoryCandidates(input.category);
  let categoryIdx = 0;

  // Insert without reading the row back: pending bills may not be readable
  // by the public select policy, which would fail the whole request.
  let lastMessage = "Unknown error";
  let saved = false;
  for (let attempt = 0; attempt < 48; attempt++) {
    const { error } = await db.from("bills").insert(row);
    if (!error) {
      saved = true;
      break;
    }
    lastMessage = error.message ?? lastMessage;
    const missing = /could not find the '([^']+)' column/i.exec(lastMessage);
    if (missing) {
      if (missing[1] in row && missing[1] !== "title") {
        delete row[missing[1]];
        continue;
      }
      break;
    }
    const notNull = /null value in column "([^"]+)"/i.exec(lastMessage);
    if (notNull) {
      const col = notNull[1];
      if (!(col in row) && col in aliases) {
        row[col] = aliases[col];
        continue;
      }
      break;
    }
    // Category rejected by an enum or check constraint: try other spellings.
    if (/category/i.test(lastMessage) && "category" in row && categoryIdx < categories.length - 1) {
      categoryIdx += 1;
      row.category = categories[categoryIdx];
      continue;
    }
    break;
  }
  if (!saved) throw new Error(`Could not save bill: ${lastMessage}`);

  return {
    id: "",
    title,
    status: "pending",
    proofUrl,
    proofFiles: uploaded,
    amount,
  };
}

/** Message shown to an owner once their single resubmission has been used. */
export const RESUBMISSION_USED_MESSAGE =
  "You've used your one resubmission for this bill. Start a fresh bill if you'd like another chance.";

/**
 * Resends a rejected bill for its single allowed round of review. Existing
 * proof files are kept; the owner may add up to three files in total.
 * Throws once the one resubmission has already been used.
 */
export async function resubmitBillForReview(billId: string, extraProofs: File[] = []): Promise<void> {
  const { data: sessionData } = await db.auth.getSession();
  const userId: string | null = sessionData?.session?.user?.id ?? null;
  if (!userId) throw new Error("Please sign in to resend this bill");

  const { data: row, error } = await db.from("bills").select("*").eq("id", billId).maybeSingle();
  if (error) throw new Error(error.message || "Could not load this bill");
  if (!row) throw new Error("We could not find that bill");

  const record = row as Record<string, unknown>;
  const owner =
    (record.user_id as string | null) ??
    (record.owner_id as string | null) ??
    (record.requester_id as string | null) ??
    (record.created_by as string | null) ??
    null;
  if (owner && owner !== userId) throw new Error("Only the bill owner can resend this bill");

  const state = rejectionStateOf(record);
  if (state.resubmissionUsed) throw new Error(RESUBMISSION_USED_MESSAGE);

  const existing = normalizeProofFiles(record.proof_files ?? record.proof_url);
  const added = extraProofs.length > 0 ? await uploadBillProofs(extraProofs, userId) : [];
  const merged = [...existing, ...added];
  if (merged.length > MAX_PROOF_FILES) {
    throw new Error(`A bill can hold up to ${MAX_PROOF_FILES} proof files. Remove one to continue.`);
  }

  const update: Record<string, unknown> = {
    status: "pending",
    rejection_reason: null,
    rejected_at: null,
    resubmission_count: state.resubmissionCount + 1,
    last_resubmitted_at: new Date().toISOString(),
  };
  if (merged.length > 0) {
    update.proof_files = merged;
    update.proof_url = merged[0].url;
  }

  const { error: updateError } = await db.from("bills").update(update).eq("id", billId);
  if (updateError) throw new Error(updateError.message || "Could not resend this bill");
}
