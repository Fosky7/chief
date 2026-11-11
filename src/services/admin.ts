import { supabase } from "@/integrations/supabase/client";

export type ReviewStatus = "pending" | "approved" | "rejected" | "funded" | "paid_out";

export interface ReviewBill {
  id: string;
  title: string;
  beneficiary: string;
  biller: string;
  category: string;
  amount: number;
  raised: number;
  status: ReviewStatus;
  submittedAt: string;
  proofUrl?: string;
  isSample?: boolean;
}

export interface Reviewer {
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

const SAMPLE_QUEUE: ReviewBill[] = [
  {
    id: "sample-1",
    title: "Final-year tuition balance",
    beneficiary: "Adaeze Okonkwo",
    biller: "University of Lagos Bursary",
    category: "Education",
    amount: 185000,
    raised: 0,
    status: "pending",
    submittedAt: "2025-01-14T09:12:00Z",
    proofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    isSample: true,
  },
  {
    id: "sample-2",
    title: "Dialysis session at LUTH",
    beneficiary: "Ibrahim Musa",
    biller: "Lagos University Teaching Hospital",
    category: "Health",
    amount: 72000,
    raised: 0,
    status: "pending",
    submittedAt: "2025-01-15T14:40:00Z",
    proofUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800",
    isSample: true,
  },
  {
    id: "sample-3",
    title: "Three months of overdue rent",
    beneficiary: "Chioma Eze",
    biller: "Greenfield Estates Ltd",
    category: "Housing",
    amount: 240000,
    raised: 0,
    status: "pending",
    submittedAt: "2025-01-16T08:05:00Z",
    isSample: true,
  },
  {
    id: "sample-4",
    title: "Prepaid electricity for a small bakery",
    beneficiary: "Tunde Bakare",
    biller: "Ikeja Electric",
    category: "Utilities",
    amount: 45000,
    raised: 45000,
    status: "funded",
    submittedAt: "2025-01-10T11:22:00Z",
    isSample: true,
  },
];

let sampleStore: ReviewBill[] = SAMPLE_QUEUE.map((b) => ({ ...b }));

function mapRow(row: Record<string, unknown>): ReviewBill {
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
  const str = (v: unknown, d = "") => (typeof v === "string" && v ? v : d);
  const rawStatus = str(row.status, "pending");
  const status: ReviewStatus = (
    ["pending", "approved", "rejected", "funded", "paid_out"] as const
  ).includes(rawStatus as ReviewStatus)
    ? (rawStatus as ReviewStatus)
    : "pending";
  return {
    id: String(row.id),
    title: str(row.title, "Untitled bill"),
    beneficiary: str(row.beneficiary_name ?? row.beneficiary, "Beneficiary"),
    biller: str(row.biller_name ?? row.biller, "Biller"),
    category: str(row.category, "General"),
    amount: num(row.amount ?? row.amount_needed ?? row.goal_amount),
    raised: num(row.amount_raised ?? row.raised),
    status,
    submittedAt: str(row.created_at, new Date().toISOString()),
    proofUrl: str(row.proof_url) || undefined,
  };
}

export async function fetchReviewQueue(): Promise<ReviewBill[]> {
  try {
    const { data, error } = await db
      .from("bills")
      .select("*")
      .in("status", ["pending", "funded"])
      .order("created_at", { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(mapRow);
    }
  } catch {
    // fall through to sample queue
  }
  return sampleStore
    .filter((b) => b.status === "pending" || b.status === "funded")
    .map((b) => ({ ...b }));
}

async function setStatus(id: string, status: ReviewStatus): Promise<ReviewBill | null> {
  if (id.startsWith("sample-")) {
    sampleStore = sampleStore.map((b) => (b.id === id ? { ...b, status } : b));
    const found = sampleStore.find((b) => b.id === id);
    return found ? { ...found } : null;
  }
  const { data, error } = await db
    .from("bills")
    .update({ status })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export function approveBill(id: string) {
  return setStatus(id, "approved");
}

export function rejectBill(id: string) {
  return setStatus(id, "rejected");
}

export function markPaidToBiller(id: string) {
  return setStatus(id, "paid_out");
}

export async function resolveReviewer(): Promise<Reviewer> {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return { userId: null, email: null, isAdmin: false };
    const appRole = (user.app_metadata as Record<string, unknown> | undefined)?.role;
    const metaRole = (user.user_metadata as Record<string, unknown> | undefined)?.role;
    let isAdmin = appRole === "admin" || metaRole === "admin";
    if (!isAdmin) {
      try {
        const { data: profile } = await db
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        isAdmin = profile?.role === "admin";
      } catch {
        // ignore
      }
    }
    return { userId: user.id, email: user.email ?? null, isAdmin };
  } catch {
    return { userId: null, email: null, isAdmin: false };
  }
}
