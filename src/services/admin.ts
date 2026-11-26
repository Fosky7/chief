import { supabase } from "@/integrations/supabase/client";
import { normalizeProofFiles, type ProofFileRef } from "@/types";

export type ReviewStatus = "pending" | "approved" | "rejected" | "funded" | "paid";

export interface ReviewBill {
  id: string;
  title: string;
  biller: string;
  category: string;
  amount: number;
  raised: number;
  status: ReviewStatus;
  submittedBy: string;
  submittedAt: string;
  imageUrl: string;
  isSample: boolean;
  /** Every proof file on the bill; a legacy single file reads as one item. */
  proofFiles: ProofFileRef[];
  /** Admin reason for the latest rejection; owner + admins only. */
  rejectionReason: string | null;
  /** Owner resubmissions used so far (0 or 1). */
  resubmissionCount: number;
}

/** Raised when an admin tries to reject without a reason. */
export class RejectionReasonRequiredError extends Error {
  constructor(message = "Enter a reason so the poster knows what to fix.") {
    super(message);
    this.name = "RejectionReasonRequiredError";
  }
}

/** Raised when a second resubmission is attempted. */
export class ResubmissionUsedError extends Error {
  constructor(message = "This bill has already used its one resubmission.") {
    super(message);
    this.name = "ResubmissionUsedError";
  }
}

export interface Reviewer {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
}

export function formatAmount(value: number): string {
  const n = Number.isFinite(value) ? value : 0;
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

const SAMPLE_QUEUE: ReviewBill[] = [
  {
    id: "sample-1",
    title: "Ikeja Electric arrears for a family of five",
    biller: "Ikeja Electric",
    category: "Electricity",
    amount: 48500,
    raised: 0,
    status: "pending",
    submittedBy: "Adaeze O.",
    submittedAt: "2025-05-02T09:30:00Z",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=70",
    isSample: true,
    proofFiles: [],
    rejectionReason: null,
    resubmissionCount: 0,
  },
  {
    id: "sample-2",
    title: "Second-term school fees at Unity Primary",
    biller: "Unity Primary School",
    category: "Education",
    amount: 125000,
    raised: 0,
    status: "pending",
    submittedBy: "Tunde A.",
    submittedAt: "2025-05-03T14:10:00Z",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=70",
    isSample: true,
    proofFiles: [],
    rejectionReason: null,
    resubmissionCount: 0,
  },
  {
    id: "sample-3",
    title: "Outpatient hospital bill at LUTH",
    biller: "Lagos University Teaching Hospital",
    category: "Health",
    amount: 86000,
    raised: 86000,
    status: "funded",
    submittedBy: "Grace E.",
    submittedAt: "2025-04-28T11:00:00Z",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=70",
    isSample: true,
    proofFiles: [],
    rejectionReason: null,
    resubmissionCount: 0,
  },
];

export function sampleQueue(): ReviewBill[] {
  return SAMPLE_QUEUE.map((b) => ({ ...b, proofFiles: b.proofFiles.map((f) => ({ ...f })) }));
}

export async function resolveReviewer(): Promise<Reviewer> {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return { userId: null, email: null, isAdmin: false };
    let isAdmin =
      (user.app_metadata as Record<string, unknown> | undefined)?.role === "admin" ||
      (user.user_metadata as Record<string, unknown> | undefined)?.role === "admin";
    if (!isAdmin) {
      try {
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role === "admin") isAdmin = true;
      } catch {
        // profiles table may not exist; treat as non-admin
      }
    }
    return { userId: user.id, email: user.email ?? null, isAdmin };
  } catch {
    return { userId: null, email: null, isAdmin: false };
  }
}

function mapRow(row: Record<string, any>): ReviewBill {
  const proofFiles = normalizeProofFiles(row.proof_files ?? row.proof_url ?? row.image_url);
  return {
    id: String(row.id),
    title: String(row.title ?? "Untitled bill"),
    biller: String(row.biller ?? row.biller_name ?? "Unknown biller"),
    category: String(row.category ?? "General"),
    amount: Number(row.amount ?? row.goal_amount ?? 0),
    raised: Number(row.raised ?? row.amount_raised ?? 0),
    status: (row.status ?? "pending") as ReviewStatus,
    submittedBy: String(row.submitted_by_name ?? row.submitted_by ?? "Member"),
    submittedAt: String(row.created_at ?? new Date().toISOString()),
    imageUrl: String(
      proofFiles[0]?.url ??
        row.image_url ??
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=70",
    ),
    isSample: false,
    proofFiles,
    rejectionReason:
      typeof row.rejection_reason === "string" && row.rejection_reason.trim()
        ? row.rejection_reason.trim()
        : null,
    resubmissionCount: Number(row.resubmission_count ?? 0) > 0 ? 1 : 0,
  };
}

export async function fetchReviewQueue(reviewer: Reviewer): Promise<ReviewBill[]> {
  if (!reviewer.isAdmin) return sampleQueue();
  try {
    const { data, error } = await (supabase as any)
      .from("bills")
      .select("*")
      .in("status", ["pending", "funded", "rejected"])
      .order("created_at", { ascending: true });
    if (error || !Array.isArray(data) || data.length === 0) return sampleQueue();
    return data.map(mapRow);
  } catch {
    return sampleQueue();
  }
}

async function setStatus(bill: ReviewBill, status: ReviewStatus): Promise<ReviewBill> {
  if (bill.isSample) return { ...bill, status };
  const { error } = await (supabase as any).from("bills").update({ status }).eq("id", bill.id);
  if (error) throw new Error(error.message || "Could not update bill");
  return { ...bill, status };
}

export function approveBill(bill: ReviewBill): Promise<ReviewBill> {
  return setStatus(bill, "approved");
}

/**
 * Rejects a bill. A reason is mandatory: it is stored on the bill and shown to
 * its owner next to the "Rejected" badge. Admins can never reject without one,
 * and can never un-reject or grant a second resubmission.
 */
export async function rejectBill(bill: ReviewBill, reason?: string): Promise<ReviewBill> {
  const trimmed = (reason ?? "").trim();
  if (!trimmed) throw new RejectionReasonRequiredError();
  if (bill.isSample) return { ...bill, status: "rejected", rejectionReason: trimmed };
  const { error } = await (supabase as any)
    .from("bills")
    .update({
      status: "rejected",
      rejection_reason: trimmed,
      rejected_at: new Date().toISOString(),
    })
    .eq("id", bill.id);
  if (error) throw new Error(error.message || "Could not reject bill");
  return { ...bill, status: "rejected", rejectionReason: trimmed };
}

export function markPaidToBiller(bill: ReviewBill): Promise<ReviewBill> {
  return setStatus(bill, "paid");
}

/**
 * Sends a rejected bill back for a single round of review on behalf of its
 * owner. The stored `resubmission_count` marker is the allowance: once it is 1
 * the bill can never be resent and the owner must start a fresh bill.
 */
export async function resendRejectedBill(bill: ReviewBill): Promise<ReviewBill> {
  const used = (bill.resubmissionCount ?? 0) >= 1;
  if (used) throw new ResubmissionUsedError();
  if (bill.isSample) {
    return { ...bill, status: "pending", rejectionReason: null, resubmissionCount: 1 };
  }
  const { error } = await (supabase as any)
    .from("bills")
    .update({
      status: "pending",
      rejection_reason: null,
      rejected_at: null,
      resubmission_count: (bill.resubmissionCount ?? 0) + 1,
      last_resubmitted_at: new Date().toISOString(),
    })
    .eq("id", bill.id);
  if (error) throw new Error(error.message || "Could not resend this bill");
  return { ...bill, status: "pending", rejectionReason: null, resubmissionCount: 1 };
}
