import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sampleBills, getSampleBill } from "@/lib/sampleBills";

export type BillStatus = "pending" | "approved" | "rejected" | "funded" | "paid" | string;

export interface BillDetail {
  id: string;
  title: string;
  story: string;
  biller: string;
  dueDate: string | null;
  goal: number;
  raised: number;
  status: BillStatus;
  category: string;
  city: string;
  requesterName: string | null;
  imageUrl: string | null;
  donorCount: number | null;
}

const CURATED_BILLS: BillDetail[] = [
  {
    id: "ada-school-fees",
    title: "Ada's final-year school fees",
    story: "Ada is one semester away from her nursing degree at UNN. Help her clear her final fees.",
    biller: "University of Nigeria, Nsukka",
    dueDate: "2025-09-30",
    goal: 250000,
    raised: 185000,
    status: "approved",
    category: "Education",
    city: "Enugu",
    requesterName: "Ada N.",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
    donorCount: 48,
  },
  {
    id: "baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    story: "Baba Tunde needs to settle his surgery bill at UCH Ibadan before discharge.",
    biller: "University College Hospital, Ibadan",
    dueDate: "2025-08-15",
    goal: 600000,
    raised: 420000,
    status: "approved",
    category: "Health",
    city: "Ibadan",
    requesterName: "Funke T.",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
    donorCount: 112,
  },
  {
    id: "single-mum-rent",
    title: "Rent for a single mum of three",
    story: "Chioma's annual rent is due next month. Help keep her family in their home in Yaba.",
    biller: "Yaba Estates Ltd",
    dueDate: "2025-10-01",
    goal: 350000,
    raised: 90000,
    status: "approved",
    category: "Housing",
    city: "Lagos",
    requesterName: "Chioma E.",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
    donorCount: 21,
  },
  {
    id: "solar-pump-kaduna",
    title: "Solar water pump for a Kaduna clinic",
    story: "A community clinic in Kaduna needs a solar pump to keep clean water flowing for patients.",
    biller: "SunFlow Energy Nigeria",
    dueDate: "2025-11-20",
    goal: 480000,
    raised: 0,
    status: "pending",
    category: "Utilities",
    city: "Kaduna",
    requesterName: "Ibrahim S.",
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=70",
    donorCount: null,
  },
];

function fromSample(s: (typeof sampleBills)[number]): BillDetail {
  return {
    id: s.id,
    title: s.title,
    story: s.description,
    biller: "Not specified",
    dueDate: null,
    goal: s.goal,
    raised: s.raised,
    status: "approved",
    category: s.category,
    city: s.city,
    requesterName: null,
    imageUrl: s.image,
    donorCount: null,
  };
}

/** Compatibility export; Discover and detail share one curated source. */
export const DEMO_BILLS: BillDetail[] = [...CURATED_BILLS, ...sampleBills.map(fromSample)];

function getDemoBill(id: string): BillDetail | undefined {
  const curated = CURATED_BILLS.find((b) => b.id === id);
  if (curated) return curated;
  const sample = getSampleBill(id) ?? getSampleBill(`sample-${id}`);
  return sample ? fromSample(sample) : undefined;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

/** Map a bills row defensively, tolerating minor column-name differences. */
function mapRow(row: Record<string, unknown>, prev?: BillDetail | null): BillDetail {
  return {
    id: String(row.id ?? prev?.id ?? ""),
    title: str(row.title) ?? prev?.title ?? "Untitled bill",
    story: str(row.story) ?? str(row.description) ?? prev?.story ?? "",
    biller: str(row.biller) ?? str(row.biller_name) ?? prev?.biller ?? "Not specified",
    dueDate: str(row.due_date) ?? prev?.dueDate ?? null,
    goal: num(row.goal ?? row.amount ?? row.amount_needed ?? prev?.goal),
    raised: num(row.raised ?? row.amount_raised ?? prev?.raised),
    status: str(row.status) ?? prev?.status ?? "pending",
    category: str(row.category) ?? prev?.category ?? "Other",
    city: str(row.city) ?? str(row.location) ?? prev?.city ?? "Nigeria",
    requesterName: str(row.requester_name) ?? prev?.requesterName ?? null,
    imageUrl: str(row.image_url) ?? str(row.cover_url) ?? prev?.imageUrl ?? null,
    donorCount: prev?.donorCount ?? null,
  };
}

export interface UseBillRealtimeResult {
  bill: BillDetail | null;
  loading: boolean;
  error: string | null;
  live: boolean;
}

/**
 * Loads a bill by id and subscribes to realtime updates of its row so the
 * progress bar moves as donations land.
 */
export function useBillRealtime(id: string): UseBillRealtimeResult {
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const fetchDonorCount = useCallback(async (billId: string): Promise<number | null> => {
    try {
      const { count, error: e } = await supabase
        .from("donations" as never)
        .select("id", { count: "exact", head: true })
        .eq("bill_id" as never, billId as never);
      return e ? null : (count ?? 0);
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLive(false);

    const demo = getDemoBill(id);
    if (demo) {
      setBill(demo);
      setLoading(false);
      return;
    }

    if (!UUID_RE.test(id)) {
      setBill(null);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error: e } = await supabase
          .from("bills" as never)
          .select("*")
          .eq("id" as never, id as never)
          .maybeSingle();
        if (cancelled) return;
        if (e) {
          setError("We couldn't load this bill. Please try again.");
          setBill(null);
        } else if (data) {
          const mapped = mapRow(data as unknown as Record<string, unknown>);
          setBill(mapped);
          const donorCount = await fetchDonorCount(id);
          if (!cancelled) setBill((b) => (b ? { ...b, donorCount } : b));
        } else {
          setBill(null);
        }
      } catch {
        if (!cancelled) setError("We couldn't reach the server. Check your connection.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`bill-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bills", filter: `id=eq.${id}` },
        (payload: { new: Record<string, unknown> }) => {
          setBill((prev) => mapRow(payload.new, prev));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "donations", filter: `bill_id=eq.${id}` },
        () => {
          void fetchDonorCount(id).then((donorCount) => {
            if (!cancelled) setBill((b) => (b ? { ...b, donorCount } : b));
          });
        },
      )
      .subscribe((status: string) => {
        if (!cancelled) setLive(status === "SUBSCRIBED");
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [id, fetchDonorCount]);

  return { bill, loading, error, live };
}
