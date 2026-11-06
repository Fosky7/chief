import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSampleBill, type BillDetail, type BillStatus } from "@/lib/sampleBills";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = Record<string, unknown>;

function num(...values: unknown[]): number {
  for (const v of values) {
    if (v === null || v === undefined || v === "") continue;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function str(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function toStatus(v: unknown): BillStatus {
  const s = typeof v === "string" ? v.toLowerCase() : "";
  if (s === "approved" || s === "live" || s === "active") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "funded" || s === "paid" || s === "completed") return "funded";
  return "pending";
}

/** Maps a bills row to the UI model, tolerating a few common column spellings. */
function mapRow(row: Row): BillDetail {
  return {
    id: String(row.id),
    title: str(row.title) ?? "Untitled bill",
    story: str(row.story, row.description) ?? "",
    biller: str(row.biller, row.biller_name, row.payee) ?? "Not provided",
    dueDate: str(row.due_date, row.due_at),
    goal: num(row.goal, row.amount, row.amount_needed, row.target_amount, row.goal_amount),
    raised: num(row.raised, row.amount_raised, row.raised_amount),
    status: toStatus(row.status),
    category: str(row.category) ?? "Other",
    city: str(row.city, row.location) ?? "Nigeria",
    imageUrl: str(row.image_url, row.cover_url, row.photo_url),
    requesterName: str(row.requester_name),
    donorCount: row.donor_count === undefined ? null : num(row.donor_count),
  };
}

export interface BillRealtimeState {
  bill: BillDetail | null;
  loading: boolean;
  error: string | null;
  /** True when subscribed to live backend updates for this bill. */
  live: boolean;
}

/**
 * Loads a bill by id and keeps its progress fresh via Supabase realtime.
 * Sample (slug) ids resolve instantly from curated data; UUIDs come from the backend.
 */
export function useBillRealtime(id: string): BillRealtimeState {
  const sample = getSampleBill(id);
  const isRemote = !sample && UUID_RE.test(id);

  const [state, setState] = useState<BillRealtimeState>({
    bill: sample,
    loading: isRemote,
    error: null,
    live: false,
  });

  const fetchBill = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("bills").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      setState((s) => ({ ...s, bill: data ? mapRow(data as Row) : null, loading: false, error: null }));
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : "Could not load this bill.",
      }));
    }
  }, [id]);

  useEffect(() => {
    if (sample) {
      setState({ bill: sample, loading: false, error: null, live: false });
      return;
    }
    if (!isRemote) {
      setState({ bill: null, loading: false, error: null, live: false });
      return;
    }

    setState({ bill: null, loading: true, error: null, live: false });
    void fetchBill();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`bill-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "bills", filter: `id=eq.${id}` }, () => {
          void fetchBill();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "donations", filter: `bill_id=eq.${id}` }, () => {
          void fetchBill();
        })
        .subscribe((status) => {
          setState((s) => ({ ...s, live: status === "SUBSCRIBED" }));
        });
    } catch {
      // Realtime is a progressive enhancement; the page still works without it.
    }

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return state;
}
