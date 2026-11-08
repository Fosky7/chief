import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toAmount } from "@/lib/currency";
import { liveSampleBills, type BillCategory, type SampleBill } from "@/lib/sampleBills";

/** A bill as shown in the discovery deck. */
export interface DeckBill {
  id: string;
  title: string;
  category: BillCategory;
  city: string;
  raised: number;
  goal: number;
  story: string;
  imageUrl: string | null;
  isSample: boolean;
}

export type BillsSource = "sample" | "live";

export interface UseApprovedBillsResult {
  bills: DeckBill[];
  loading: boolean;
  error: string | null;
  source: BillsSource;
  refresh: () => void;
}

const CATEGORIES: BillCategory[] = ["Education", "Health", "Housing", "Utilities"];

function toCategory(value: unknown): BillCategory {
  const s = String(value ?? "").toLowerCase();
  const hit = CATEGORIES.find((c) => c.toLowerCase() === s);
  if (hit) return hit;
  if (s.includes("school") || s.includes("fee")) return "Education";
  if (s.includes("hosp") || s.includes("medic")) return "Health";
  if (s.includes("rent")) return "Housing";
  return "Utilities";
}

function fromSample(b: SampleBill): DeckBill {
  return {
    id: b.id,
    title: b.title,
    category: b.category,
    city: b.city,
    raised: b.raised,
    goal: b.goal,
    story: b.story,
    imageUrl: b.imageUrl,
    isSample: true,
  };
}

type Row = Record<string, unknown>;

function pick(row: Row, keys: string[]): unknown {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
  }
  return undefined;
}

/** Map a DB row defensively — column names vary across schema revisions. */
function fromRow(row: Row): DeckBill | null {
  const id = pick(row, ["id"]);
  const title = pick(row, ["title", "name"]);
  const goal = toAmount(pick(row, ["goal", "goal_amount", "amount_needed", "amount", "target_amount"]));
  if (!id || !title || goal <= 0) return null;
  return {
    id: String(id),
    title: String(title),
    category: toCategory(pick(row, ["category", "bill_type", "type"])),
    city: String(pick(row, ["city", "location", "state"]) ?? "Nigeria"),
    raised: toAmount(pick(row, ["raised", "raised_amount", "amount_raised", "total_raised"])),
    goal,
    story: String(pick(row, ["story", "description"]) ?? ""),
    imageUrl: (pick(row, ["image_url", "imageUrl", "photo_url", "image"]) as string | undefined) ?? null,
    isSample: false,
  };
}

// Minimal structural typing so this works whether or not generated DB types include "bills".
interface LooseQuery {
  select: (cols: string) => LooseQuery;
  eq: (col: string, val: string) => LooseQuery;
  limit: (n: number) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>;
}
interface LooseClient {
  from: (table: string) => LooseQuery;
}

/**
 * Loads approved bills for the swipe deck. Sample bills are shown immediately
 * and remain as the fallback if the backend is empty or unreachable.
 */
export function useApprovedBills(): UseApprovedBillsResult {
  const [bills, setBills] = useState<DeckBill[]>(() => liveSampleBills.map(fromSample));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<BillsSource>("sample");
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const client = supabase as unknown as LooseClient;
        const { data, error: qError } = await client
          .from("bills")
          .select("*")
          .eq("status", "approved")
          .limit(50);
        if (cancelled || !mounted.current) return;
        if (qError) throw new Error(qError.message);
        const live = (data ?? []).map(fromRow).filter((b): b is DeckBill => b !== null);
        if (live.length > 0) {
          setBills(live);
          setSource("live");
        } else {
          setBills(liveSampleBills.map(fromSample));
          setSource("sample");
        }
        setError(null);
      } catch (e) {
        if (cancelled || !mounted.current) return;
        // Keep the sample deck visible; surface the error for diagnostics only.
        setBills(liveSampleBills.map(fromSample));
        setSource("sample");
        setError(e instanceof Error ? e.message : "Could not load bills");
      } finally {
        if (!cancelled && mounted.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { bills, loading, error, source, refresh };
}
