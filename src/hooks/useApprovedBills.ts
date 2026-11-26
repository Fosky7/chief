import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sampleBills } from "@/lib/sampleBills";

/** Normalised bill shape consumed by the discover deck. Amounts are in naira. */
export type ApprovedBill = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  goal: number;
  raised: number;
  image: string | null;
};

export type UseApprovedBillsResult = {
  bills: ApprovedBill[];
  data: ApprovedBill[];
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  /** True when the deck is showing built-in sample bills instead of live data. */
  isSample: boolean;
  refresh: () => Promise<void>;
};

type Row = Record<string, unknown>;

function pickNumber(row: Row, keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v === undefined || v === null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function pickString(row: Row, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

export function normalizeBillRow(row: Row): ApprovedBill {
  return {
    id: String(row.id),
    title: pickString(row, ["title", "name"], "Untitled bill"),
    description: pickString(row, ["description", "story", "summary"]),
    category: pickString(row, ["category"], "General"),
    city: pickString(row, ["city", "location", "state"]),
    goal: pickNumber(row, ["amount_needed", "goal_amount", "target_amount", "goal", "amount"]),
    raised: pickNumber(row, ["amount_raised", "raised_amount", "funded_amount", "raised"]),
    image: pickString(row, ["image_url", "image", "photo_url", "cover_url"]) || null,
  };
}

const fallbackBills: ApprovedBill[] = sampleBills.map((b) => ({ ...b }));

// Loosely typed handle so the query works regardless of generated table types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Loads bills with status "approved" that still need funding.
 * Falls back to sample bills when none exist or the backend is unreachable,
 * so the discover deck is never empty.
 */
export function useApprovedBills(): UseApprovedBillsResult {
  const [bills, setBills] = useState<ApprovedBill[]>(fallbackBills);
  const [isSample, setIsSample] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: queryError } = await db
        .from("bills")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);
      if (queryError) throw queryError;

      const live = ((data ?? []) as Row[])
        .map(normalizeBillRow)
        .filter((b) => b.goal > 0 && b.raised < b.goal);

      if (live.length > 0) {
        setBills(live);
        setIsSample(false);
      } else {
        setBills(fallbackBills);
        setIsSample(true);
      }
      setError(null);
    } catch (e) {
      setBills(fallbackBills);
      setIsSample(true);
      setError(e instanceof Error ? e.message : "Could not load bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { bills, data: bills, loading, isLoading: loading, error, isSample, refresh };
}

export default useApprovedBills;
