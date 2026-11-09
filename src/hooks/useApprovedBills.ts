import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sampleBills, type BillDetail } from "@/lib/sampleBills";
import { toFiniteNumber } from "@/lib/currency";

/** The approved-bill shape consumed by the swipe deck. */
export type ApprovedBill = BillDetail;

export type UseApprovedBillsResult = {
  /** Bills to render in the deck (backend feed, falling back to samples). */
  bills: ApprovedBill[];
  /** Convenience accessor for the card currently on top of the deck. */
  topBill: ApprovedBill | null;
  loading: boolean;
  error: string | null;
  /** True when the backend returned nothing and sample data is shown instead. */
  usingSampleData: boolean;
  /** Re-runs the feed query (also triggered by realtime updates). */
  refresh: () => Promise<void>;
};

type Row = Record<string, unknown>;

/** Column names vary slightly between schema revisions; probe in priority order. */
const GOAL_KEYS = ["amount_needed", "goal_amount", "target_amount", "amount", "goal"];
const RAISED_KEYS = ["amount_raised", "raised_amount", "funded_amount", "raised"];
const TITLE_KEYS = ["title", "name"];
const CATEGORY_KEYS = ["category", "bill_category", "type"];
const CITY_KEYS = ["city", "location", "state"];
const IMAGE_KEYS = ["image_url", "imageUrl", "photo_url", "cover_image_url"];
const SUMMARY_KEYS = ["summary", "description", "short_description"];
const STORY_KEYS = ["story", "details", "long_description", "description"];
const BILLER_KEYS = ["biller", "biller_name", "payee"];
const DUE_KEYS = ["due_date", "dueDate", "deadline"];
const DONOR_KEYS = ["donor_count", "donors_count", "donors"];
const REQUESTER_KEYS = ["requester_name", "full_name", "beneficiary_name"];

function pickString(row: Row, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function pickNumber(row: Row, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const parsed = toFiniteNumber(row[key], Number.NaN);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/** Normalises a raw `bills` row into the deck's `BillDetail` shape. */
export function mapBillRow(row: Row): ApprovedBill {
  const status = pickString(row, ["status"], "approved").toLowerCase();

  return {
    id: String(row.id ?? pickString(row, ["bill_id", "slug"], "")),
    title: pickString(row, TITLE_KEYS, "Untitled bill"),
    category: pickString(row, CATEGORY_KEYS, "Other"),
    city: pickString(row, CITY_KEYS, "Nigeria"),
    summary: pickString(row, SUMMARY_KEYS, ""),
    story: pickString(row, STORY_KEYS, ""),
    biller: pickString(row, BILLER_KEYS, "Verified biller"),
    imageUrl: pickString(row, IMAGE_KEYS, ""),
    goal: pickNumber(row, GOAL_KEYS),
    raised: pickNumber(row, RAISED_KEYS),
    dueDate: pickString(row, DUE_KEYS, ""),
    donorCount: pickNumber(row, DONOR_KEYS),
    requesterName: pickString(row, REQUESTER_KEYS, ""),
    status: status === "pending" ? "pending" : "approved",
  };
}

function toBills(rows: Row[]): ApprovedBill[] {
  return rows.map(mapBillRow).filter((bill) => bill.id.length > 0);
}

/**
 * Reads approved bills from the backend.
 *
 * Some deployments predate the `status` column, so a failed filtered query is
 * retried without the filter and the rows are filtered client-side instead.
 */
async function fetchApprovedBills(): Promise<ApprovedBill[]> {
  const filtered = await supabase.from("bills").select("*").eq("status", "approved");

  if (!filtered.error) {
    return toBills((filtered.data ?? []) as Row[]);
  }

  const unfiltered = await supabase.from("bills").select("*");
  if (unfiltered.error) {
    throw new Error(unfiltered.error.message || "Could not load approved bills");
  }

  return toBills((unfiltered.data ?? []) as Row[]).filter(
    (bill) => bill.status === "approved",
  );
}

/**
 * Feed of approved bills for the discovery swipe deck.
 *
 * Falls back to the curated sample bills whenever the backend is empty or
 * unreachable so `/discover` always renders a usable deck.
 */
export function useApprovedBills(): UseApprovedBillsResult {
  const [remoteBills, setRemoteBills] = useState<ApprovedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    try {
      const rows = await fetchApprovedBills();
      if (!mountedRef.current) return;
      setRemoteBills(rows);
      setError(null);
    } catch (loadError) {
      if (!mountedRef.current) return;
      setRemoteBills([]);
      setError(
        loadError instanceof Error ? loadError.message : "Could not load approved bills",
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("approved-bills-feed")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bills" },
          () => {
            void load();
          },
        )
        .subscribe();
    } catch (subscribeError) {
      // Realtime is a nice-to-have; the deck still works from the initial read.
      console.warn("[useApprovedBills] realtime subscription unavailable", subscribeError);
    }

    return () => {
      mountedRef.current = false;
      if (channel) {
        try {
          void supabase.removeChannel(channel);
        } catch (removeError) {
          console.warn("[useApprovedBills] could not remove channel", removeError);
        }
      }
    };
  }, [load]);

  const bills = useMemo<ApprovedBill[]>(
    () => (remoteBills.length > 0 ? remoteBills : sampleBills),
    [remoteBills],
  );

  return {
    bills,
    topBill: bills.length > 0 ? bills[0] : null,
    loading,
    error,
    usingSampleData: remoteBills.length === 0,
    refresh: load,
  };
}

export default useApprovedBills;
