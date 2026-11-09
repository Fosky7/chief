import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sampleBills, getSampleBill, type SampleBill } from "@/lib/sampleBills";

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

/** Convert a curated sample bill into the full detail shape. */
function sampleToDetail(s: SampleBill): BillDetail {
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
export const DEMO_BILLS: BillDetail[] = sampleBills.map(sampleToDetail);

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

    const demo = getSampleBill(id);
    if (demo) {
      setBill(sampleToDetail(demo));
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
