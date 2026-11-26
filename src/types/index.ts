/** Shared domain types for Chief. */

export const BILL_CATEGORIES = ["Education", "Health", "Housing", "Utilities"] as const;
export type BillCategory = (typeof BILL_CATEGORIES)[number];

export type BillStatus = "pending" | "approved" | "rejected" | "funded" | "paid";

/**
 * Proof-file allowance, enforced centrally so every screen states the same rule:
 * up to three files of at most 5 MB each.
 */
export const MAX_PROOF_FILES = 3;
export const MAX_PROOF_BYTES = 5 * 1024 * 1024;
export const PROOF_ACCEPT = "image/*,application/pdf";
export const PROOF_ALLOWANCE_HINT = "Up to 3 files, 5 MB each (photo or PDF).";

/** One uploaded proof file as stored on a bill. */
export interface ProofFileRef {
  url: string;
  name: string;
  size: number;
  type: string;
}

/** Human-readable byte size, e.g. 2048 -> "2.0 KB". */
export function formatFileSize(bytes: number): string {
  const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Central proof-file check. Returns a user-facing message when the selection
 * breaks the allowance, otherwise null. Used by the uploader and by the
 * services so the UI and the write path can never disagree.
 */
export function proofSelectionError(files: File[]): string | null {
  if (files.length > MAX_PROOF_FILES) {
    return `You can attach up to ${MAX_PROOF_FILES} proof files. Remove one to continue.`;
  }
  const oversized = files.find((file) => file.size > MAX_PROOF_BYTES);
  if (oversized) {
    return `${oversized.name} is ${formatFileSize(oversized.size)} — each file must be 5 MB or smaller.`;
  }
  return null;
}

/**
 * Reads the stored proof files of a bill. Older bills saved a single
 * `proof_url`, so that value is read as a one-item list. Never throws.
 */
export function normalizeProofFiles(value: unknown): ProofFileRef[] {
  const fromEntry = (entry: unknown): ProofFileRef | null => {
    if (typeof entry === "string") {
      const url = entry.trim();
      if (!url) return null;
      return { url, name: url.split("/").pop() || "Proof file", size: 0, type: "" };
    }
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const url = typeof record.url === "string" ? record.url.trim() : "";
      if (!url) return null;
      const name =
        typeof record.name === "string" && record.name.trim()
          ? record.name.trim()
          : url.split("/").pop() || "Proof file";
      const size = Number(record.size);
      const type = typeof record.type === "string" ? record.type : "";
      return { url, name, size: Number.isFinite(size) ? size : 0, type };
    }
    return null;
  };

  const list: unknown[] = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map(fromEntry)
    .filter((file): file is ProofFileRef => file !== null)
    .slice(0, MAX_PROOF_FILES);
}

/** Owner-facing rejection state derived from a bill row. */
export interface BillRejectionState {
  /** Admin-provided reason; null unless the bill was rejected. */
  reason: string | null;
  resubmissionCount: number;
  /** True once the owner has used their single resubmission. */
  resubmissionUsed: boolean;
  /** True only while a rejected bill still has its resubmission available. */
  canResubmit: boolean;
}

/**
 * Derives the resubmission state of a bill. The stored marker is
 * `resubmission_count` (0 or 1); anything above zero means the one allowed
 * resubmission has been used.
 */
export function rejectionStateOf(row: Record<string, unknown> | null | undefined): BillRejectionState {
  const record = row ?? {};
  const rawReason =
    (typeof record.rejection_reason === "string" && record.rejection_reason) ||
    (typeof record.rejectionReason === "string" && record.rejectionReason) ||
    "";
  const reason = rawReason.trim() ? rawReason.trim() : null;
  const rawCount = Number(record.resubmission_count ?? record.resubmissionCount ?? 0);
  const resubmissionCount = Number.isFinite(rawCount) && rawCount > 0 ? 1 : 0;
  const resubmissionUsed = resubmissionCount >= 1;
  const status = typeof record.status === "string" ? record.status.toLowerCase() : "";
  const rejected = status === "rejected" || status === "declined";
  return {
    reason,
    resubmissionCount,
    resubmissionUsed,
    canResubmit: rejected && !resubmissionUsed,
  };
}

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
  /** Selected proof files (up to three). */
  proofs?: File[];
  /** Legacy single-file field, read as a one-item list when `proofs` is absent. */
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
  /** All stored proof files; a single-file bill reads as a one-item list. */
  proofFiles?: ProofFileRef[];
  status: BillStatus;
  createdAt: string;
  /** Admin reason, only present on rejected bills and only for owner/admins. */
  rejectionReason?: string | null;
  /** How many owner resubmissions have been used (0 or 1). */
  resubmissionCount?: number;
}
