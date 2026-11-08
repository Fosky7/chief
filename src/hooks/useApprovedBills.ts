import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { liveSampleBills } from "@/lib/sampleBills";

export interface ApprovedBill {
  id: string;
  title: string;
  category: string;
  city: string;
  raised: number;
  goal: number;
  /** Remaining amount still needed. */
  needed: number;
  imageUrl: string | null;
  story: string;
  biller: string;
  dueDate: string | null;
}

export type ApprovedBillsSource = "live" | "sample";

export interface UseApprovedBillsResult {
  bills: ApprovedBill[];
  loading: boolean;
  error: string | null;
  source: ApprovedBillsSource;
  refresh: () => Promise<void>;
}

type Row = Record<string, unknown>;

function pickString(row: Row, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

function pickNumber(row: Row, keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

/** Map a bills row to ApprovedBill, tolerating a few likely column namings. */
export function mapBillRow(row: Row): ApprovedBill | null {
  const id = row.id;
  if (typeof id !== "string" && typeof id !== "number") return null;
  const goal = pickNumber(row, ["goal_amount", "amount_needed", "goal", "amount", "target_amount"]);
  const raised = pickNumber(row, ["amount_raised", "raised_amount", "raised", "total_raised"]);
  if (goal <= 0) return null;
  return {
    id: String(id),
    title: pickString(row, ["title", "name"], "Untitled bill"),
    category: titleCase(pickString(row, ["category"], "Utilities")),
    city: pickString(row, ["city", "location"], "Nigeria"),
    raised,
    goal,
    needed: Math.max(goal - raised, 0),
    imageUrl: pickString(row, ["image_url", "photo_url", "image"]) || null,
    story: pickString(row, ["story", "description"]),
    biller: pickString(row, ["biller_name", "biller"], "Verified biller"),
    dueDate: pickString(row, ["due_date"]) || null,
  };
}

const sampleFallback: ApprovedBill[] = liveSampleBills.map((b) => ({
  id: b.id,
  title: b.title,
  category: b.category,
  city: b.city,
  raised: b.raised,
  goal: b.goal,
  needed: b.needed,
  imageUrl: b.imageUrl,
  story: b.story,
  biller: b.biller,
  dueDate: b.dueDate,
}));

/**
 * Loads approved bills that still need funding. Starts with realistic sample
 * bills so the deck is never empty, then swaps in live rows when available.
 */
export function useApprovedBills(limit = 50): UseApprovedBillsResult {
  const [bills, setBills] = useState<ApprovedBill[]>(sampleFallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<ApprovedBillsSource>("sample");
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: qErr } = await supabase
        .from("bills")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (!mounted.current) return;
      if (qErr) throw qErr;
      const mapped = ((data ?? []) as Row[])
        .map(mapBillRow)
        .filter((b): b is ApprovedBill => b !== null && b.needed > 0);
      if (mapped.length > 0) {
        setBills(mapped);
        setSource("live");
      } else {
        setBills(sampleFallback);
        setSource("sample");
      }
      setError(null);
    } catch (e) {
      if (!mounted.current) return;
      setBills(sampleFallback);
      setSource("sample");
      setError(e instanceof Error ? e.message : "Could not load bills");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { bills, loading, error, source, refresh: load };
}
