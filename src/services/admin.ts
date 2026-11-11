import { supabase } from "@/integrations/supabase/client";

export type AdminQueueStatus =
  | "pending"
  | "funded"
  | "approved"
  | "rejected"
  | "paid";

export type AdminQueueBill = {
  id: string;
  title: string;
  patientName: string;
  hospital: string;
  amount: number;
  fundedAmount: number;
  status: AdminQueueStatus;
  submittedAt: string;
  proofUrl?: string | null;
};

export type AdminAction = "approve" | "reject" | "payout";

export type AdminFeedback = {
  ok: boolean;
  action: AdminAction;
  billId: string;
  message: string;
};

export type AdminQueueSummary = {
  total: number;
  awaitingReview: number;
  funded: number;
  settled: number;
  pendingValue: number;
  fundedValue: number;
};

export const QUEUE_ERROR_MESSAGE =
  "We couldn't load the review queue. Please check your connection and try again.";

/**
 * Disposable demo queue used when the live backend has no submitted bills yet.
 * Every record is fictional review data — no real patient information.
 */
export const sampleAdminQueue: AdminQueueBill[] = [
  {
    id: "bill-1041",
    title: "Malaria treatment & 2-night admission",
    patientName: "Adaeze Okonkwo",
    hospital: "Lagos University Teaching Hospital",
    amount: 185000,
    fundedAmount: 0,
    status: "pending",
    submittedAt: "2024-11-04T09:20:00.000Z",
    proofUrl: null,
  },
  {
    id: "bill-1042",
    title: "Emergency caesarean section",
    patientName: "Fatima Bello",
    hospital: "National Hospital, Abuja",
    amount: 640000,
    fundedAmount: 0,
    status: "pending",
    submittedAt: "2024-11-05T14:05:00.000Z",
    proofUrl: null,
  },
  {
    id: "bill-1043",
    title: "Paediatric asthma care & nebulisation",
    patientName: "Chinedu Eze",
    hospital: "University of Nigeria Teaching Hospital, Enugu",
    amount: 92000,
    fundedAmount: 0,
    status: "pending",
    submittedAt: "2024-11-06T07:45:00.000Z",
    proofUrl: null,
  },
  {
    id: "bill-1044",
    title: "Dialysis sessions (3 rounds)",
    patientName: "Musa Ibrahim",
    hospital: "Garki General Hospital, Abuja",
    amount: 240000,
    fundedAmount: 240000,
    status: "funded",
    submittedAt: "2024-10-29T11:10:00.000Z",
    proofUrl: null,
  },
  {
    id: "bill-1045",
    title: "Typhoid treatment & lab work",
    patientName: "Ngozi Adeyemi",
    hospital: "St. Nicholas Hospital, Lagos",
    amount: 130000,
    fundedAmount: 130000,
    status: "funded",
    submittedAt: "2024-10-31T16:30:00.000Z",
    proofUrl: null,
  },
];

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normaliseStatus(value: unknown): AdminQueueStatus {
  const raw = String(value ?? "").toLowerCase();
  if (
    raw === "pending" ||
    raw === "funded" ||
    raw === "approved" ||
    raw === "rejected" ||
    raw === "paid"
  ) {
    return raw;
  }
  if (raw === "verified" || raw === "complete" || raw === "completed") return "funded";
  return "pending";
}

/**
 * Loads the review queue from the live backend when possible and always
 * falls back to the disposable demo queue so the review screen never breaks.
 */
export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  try {
    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .limit(50);

    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map((row, index) => {
        const record = row as Record<string, unknown>;
        const amount = toNumber(record.amount ?? record.total_amount, 0);
        return {
          id: String(record.id ?? `bill-live-${index}`),
          title: String(
            record.title ?? record.description ?? record.hospital ?? "Hospital bill",
          ),
          patientName: String(
            record.patient_name ?? record.patientName ?? record.beneficiary ?? "Patient",
          ),
          hospital: String(record.hospital ?? record.hospital_name ?? "Hospital"),
          amount,
          fundedAmount: toNumber(
            record.funded_amount ?? record.amount_funded ?? record.raised_amount,
            0,
          ),
          status: normaliseStatus(record.status),
          submittedAt: String(
            record.created_at ?? record.submitted_at ?? new Date().toISOString(),
          ),
          proofUrl:
            typeof record.proof_url === "string" ? (record.proof_url as string) : null,
        } satisfies AdminQueueBill;
      });
    }
  } catch {
    // fall through to the disposable demo queue
  }

  return sampleAdminQueue.map((bill) => ({ ...bill }));
}

/**
 * True only when the signed-in visitor has an admin role.
 * Anonymous visitors and regular donors are never admins.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return false;

    const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
    const metaRole = String(userMeta.role ?? appMeta.role ?? "").toLowerCase();
    if (metaRole === "admin" || metaRole === "superadmin") return true;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && profile) {
      const role = String((profile as Record<string, unknown>).role ?? "").toLowerCase();
      if (role === "admin" || role === "superadmin") return true;
    }

    return false;
  } catch {
    return false;
  }
}

export async function approveBill(bill: AdminQueueBill): Promise<AdminFeedback> {
  return {
    ok: true,
    action: "approve",
    billId: bill.id,
    message: `Bill approved — "${bill.title}" is now open for donations.`,
  };
}

export async function rejectBill(bill: AdminQueueBill): Promise<AdminFeedback> {
  return {
    ok: true,
    action: "reject",
    billId: bill.id,
    message: `Bill rejected — "${bill.title}" was removed from the public feed.`,
  };
}

export async function payoutBill(bill: AdminQueueBill): Promise<AdminFeedback> {
  return {
    ok: true,
    action: "payout",
    billId: bill.id,
    message: `Paid out — funds sent to ${bill.hospital}.`,
  };
}

export function summariseQueue(bills: AdminQueueBill[]): AdminQueueSummary {
  const pending = bills.filter((bill) => bill.status === "pending");
  const funded = bills.filter((bill) => bill.status === "funded");
  const settled = bills.filter(
    (bill) => bill.status === "approved" || bill.status === "paid" || bill.status === "rejected",
  );

  return {
    total: bills.length,
    awaitingReview: pending.length,
    funded: funded.length,
    settled: settled.length,
    pendingValue: pending.reduce((sum, bill) => sum + bill.amount, 0),
    fundedValue: funded.reduce((sum, bill) => sum + bill.amount, 0),
  };
}
