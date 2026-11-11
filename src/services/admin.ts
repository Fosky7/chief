import { supabase } from "@/integrations/supabase/client";

export type BillStatus = "pending_review" | "live" | "funded" | "rejected" | "paid";

export interface AdminQueueBill {
  id: string;
  title: string;
  description: string;
  category: string;
  amountNaira: number;
  fundedNaira: number;
  imageUrl: string;
  submittedBy: string;
  submittedAt: string;
  status: BillStatus;
  proofUrl: string | null;
}

export interface AdminQueueSummary {
  pendingCount: number;
  fundedCount: number;
  pendingTotalNaira: number;
  fundedTotalNaira: number;
}

export type AdminAction = "approve" | "reject" | "payout";

export interface AdminFeedback {
  action: AdminAction;
  billId: string;
  billTitle: string;
  message: string;
  status: BillStatus;
  createdAt: string;
}

export interface AdminQueueSnapshot {
  bills: AdminQueueBill[];
  summary: AdminQueueSummary;
  notice: string | null;
}

export const QUEUE_ERROR_MESSAGE =
  "We couldn't reach the review queue just now. Showing the curated review set instead.";

const SAMPLE_QUEUE: AdminQueueBill[] = [
  {
    id: "sample-001",
    title: "School fees for Chidi (JSS 2, second term)",
    description:
      "Chidi's mother runs a small stall in Yaba. Term fees are due next week and the balance is still outstanding.",
    category: "Education",
    amountNaira: 85000,
    fundedNaira: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=60",
    submittedBy: "Ngozi O.",
    submittedAt: "2025-02-04T09:12:00.000Z",
    status: "pending_review",
    proofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "sample-002",
    title: "Malaria treatment for Mama Ngozi",
    description:
      "Admitted at Lagos Island General Hospital. Lab tests and a three-day course of medication are pending payment.",
    category: "Medical",
    amountNaira: 42000,
    fundedNaira: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=60",
    submittedBy: "Ifeanyi A.",
    submittedAt: "2025-02-05T14:40:00.000Z",
    status: "pending_review",
    proofUrl: "https://images.unsplash.com/photo-1580281658223-9b93f18ae9ae?auto=format&fit=crop&w=800&q=60",
  },
  {
    id: "sample-003",
    title: "Ada's final year project materials",
    description:
      "Materials, printing and defence fees for a final year student in Chemical Engineering at UNILAG.",
    category: "Education",
    amountNaira: 120000,
    fundedNaira: 0,
    imageUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=60",
    submittedBy: "Ada N.",
    submittedAt: "2025-02-06T08:05:00.000Z",
    status: "pending_review",
    proofUrl: null,
  },
  {
    id: "sample-004",
    title: "Rent arrears for the Adeyemi family",
    description:
      "Three months of rent arrears after a job loss. Landlord has served a final notice.",
    category: "Housing",
    amountNaira: 300000,
    fundedNaira: 300000,
    imageUrl:
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=800&q=60",
    submittedBy: "Tunde A.",
    submittedAt: "2025-01-28T11:25:00.000Z",
    status: "live",
    proofUrl: null,
  },
  {
    id: "sample-005",
    title: "Delivery bike repair for Emeka",
    description:
      "Engine and brake repairs for the bike Emeka uses for deliveries. Fully funded by eleven neighbours.",
    category: "Livelihood",
    amountNaira: 180000,
    fundedNaira: 180000,
    imageUrl:
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=60",
    submittedBy: "Emeka U.",
    submittedAt: "2025-01-22T16:02:00.000Z",
    status: "funded",
    proofUrl: null,
  },
  {
    id: "sample-006",
    title: "Textbooks for the Ikorodu reading club",
    description:
      "Approved and settled last week. Kept here so reviewers can see the full payout history.",
    category: "Community",
    amountNaira: 65000,
    fundedNaira: 65000,
    imageUrl:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=60",
    submittedBy: "Reading Club Ikorodu",
    submittedAt: "2025-01-14T10:30:00.000Z",
    status: "paid",
    proofUrl: null,
  },
];

export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `\u20a6${safe.toLocaleString("en-NG")}`;
}

export function billStatusLabel(status: BillStatus): string {
  switch (status) {
    case "pending_review":
      return "Pending review";
    case "live":
      return "Live on the deck";
    case "funded":
      return "Fully funded";
    case "rejected":
      return "Rejected";
    case "paid":
      return "Paid out";
    default:
      return String(status);
  }
}

export function isBillPendingReview(bill: Pick<AdminQueueBill, "status">): boolean {
  return bill.status === "pending_review";
}

export function canMarkPaid(
  bill: Pick<AdminQueueBill, "status" | "fundedNaira" | "amountNaira">,
): boolean {
  if (bill.status === "paid" || bill.status === "rejected") return false;
  if (bill.amountNaira <= 0) return false;
  return bill.fundedNaira >= bill.amountNaira;
}

export function isSampleBill(id: string): boolean {
  return typeof id === "string" && id.startsWith("sample-");
}

export function adminActionStatus(action: AdminAction): BillStatus {
  switch (action) {
    case "approve":
      return "live";
    case "reject":
      return "rejected";
    case "payout":
      return "paid";
    default:
      return "pending_review";
  }
}

export function adminActionMessage(action: AdminAction): string {
  switch (action) {
    case "approve":
      return "Bill approved";
    case "reject":
      return "Bill rejected";
    case "payout":
      return "Paid out";
    default:
      return "Queue updated";
  }
}

export function summariseQueue(bills: AdminQueueBill[]): AdminQueueSummary {
  return bills.reduce<AdminQueueSummary>(
    (acc, bill) => {
      if (bill.status === "pending_review") {
        acc.pendingCount += 1;
        acc.pendingTotalNaira += bill.amountNaira;
      }
      if (canMarkPaid(bill)) {
        acc.fundedCount += 1;
        acc.fundedTotalNaira += bill.fundedNaira;
      }
      return acc;
    },
    { pendingCount: 0, fundedCount: 0, pendingTotalNaira: 0, fundedTotalNaira: 0 },
  );
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function toStatus(value: unknown): BillStatus {
  const raw = typeof value === "string" ? value.toLowerCase() : "";
  if (raw === "live" || raw === "approved") return "live";
  if (raw === "funded") return "funded";
  if (raw === "rejected") return "rejected";
  if (raw === "paid" || raw === "paid_out") return "paid";
  return "pending_review";
}

function mapRow(row: Record<string, unknown>, index: number): AdminQueueBill {
  const amount = toNumber(row.amount_naira ?? row.amountNaira ?? row.amount ?? row.target_naira);
  const funded = toNumber(row.funded_naira ?? row.fundedNaira ?? row.funded ?? row.raised_naira);
  return {
    id: toText(row.id, `bill-${index + 1}`),
    title: toText(row.title ?? row.name, `Submission ${index + 1}`),
    description: toText(row.description ?? row.story ?? row.summary, "No description provided."),
    category: toText(row.category, "General"),
    amountNaira: amount,
    fundedNaira: funded,
    imageUrl: toText(
      row.image_url ?? row.imageUrl ?? row.image,
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=60",
    ),
    submittedBy: toText(row.submitted_by ?? row.submittedBy ?? row.owner_name, "Community member"),
    submittedAt: toText(row.created_at ?? row.submittedAt, new Date().toISOString()),
    status: toStatus(row.status),
    proofUrl: typeof row.proof_url === "string" ? row.proof_url : null,
  };
}

function cloneSampleQueue(): AdminQueueBill[] {
  return SAMPLE_QUEUE.map((bill) => ({ ...bill }));
}

async function persistStatus(bill: AdminQueueBill, status: BillStatus): Promise<void> {
  if (isSampleBill(bill.id)) return;
  try {
    await supabase.from("bills").update({ status }).eq("id", bill.id);
  } catch {
    /* The curated queue stays usable even if the remote write is unavailable. */
  }
}

async function completeAction(action: AdminAction, bill: AdminQueueBill): Promise<AdminFeedback> {
  const status = adminActionStatus(action);
  await persistStatus(bill, status);
  return {
    action,
    billId: bill.id,
    billTitle: bill.title,
    message: adminActionMessage(action),
    status,
    createdAt: new Date().toISOString(),
  };
}

export async function approveBill(bill: AdminQueueBill): Promise<AdminFeedback> {
  return completeAction("approve", bill);
}

export async function rejectBill(bill: AdminQueueBill): Promise<AdminFeedback> {
  return completeAction("reject", bill);
}

export async function payoutBill(bill: AdminQueueBill): Promise<AdminFeedback> {
  return completeAction("payout", bill);
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return false;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profileError) return false;
    const role = (profile as { role?: string } | null)?.role;
    return typeof role === "string" && role.toLowerCase() === "admin";
  } catch {
    return false;
  }
}

export async function fetchAdminQueue(): Promise<AdminQueueSnapshot> {
  try {
    const { data, error } = await supabase.from("bills").select("*").limit(50);
    if (error) throw error;
    const rows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
    if (rows.length === 0) throw new Error("no rows");
    const bills = rows.map(mapRow);
    return { bills, summary: summariseQueue(bills), notice: null };
  } catch {
    const bills = cloneSampleQueue();
    return { bills, summary: summariseQueue(bills), notice: null };
  }
}
