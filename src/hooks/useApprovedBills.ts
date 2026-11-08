import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SAMPLE_BILLS } from "@/lib/sampleBills";
import { formatNaira, formatNairaAmount } from "@/lib/currency";

export { formatNaira, formatNairaAmount };

/** A bill ready to be shown in the discover deck. Amounts are whole naira. */
export interface ApprovedBill {
  id: string;
  title: string;
  story: string;
  category: string;
  city: string;
  biller: string;
  imageUrl: string | null;
  /** Total amount requested. */
  goal: number;
  /** Amount donated so far. */
  raised: number;
  /** Amount still needed (goal - raised, never negative). */
  needed: number;
  dueDate: string | null;
  /** True for built-in sample bills (not backed by the database). */
  isSample: boolean;
}

type Row = Record<string, unknown>;

function pickNumber(row: Row, keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v === null || v === undefined || v === "") continue;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function pickString(row: Row, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return null;
}

/** Map a database row defensively; column names vary across schema revisions. */
export function mapBillRow(row: Row): ApprovedBill | null {
  const id = row.id;
  const title = pickString(row, ["title", "name"]);
  if ((typeof id !== "string" && typeof id !== "number") || !title) return null;

  const goal = pickNumber(row, ["goal", "amount_needed", "target_amount", "amount", "goal_amount"]);
  const raised = pickNumber(row, ["raised", "amount_raised", "raised_amount"]);

  return {
    id: String(id),
    title,
    story: pickString(row, ["story", "description"]) ?? "",
    category: pickString(row, ["category"]) ?? "Other",
    city: pickString(row, ["city", "location", "state"]) ?? "Nigeria",
    biller: pickString(row, ["biller", "biller_name"]) ?? "Verified biller",
    imageUrl: pickString(row, ["image_url", "photo_url", "imageUrl"]),
    goal,
    raised,
    needed: Math.max(goal - raised, 0),
    dueDate: pickString(row, ["due_date", "dueDate"]),
    isSample: false,
  };
}

interface LooseQuery {
  select: (cols: string) => LooseQuery;
  eq: (col: string, val: string) => LooseQuery;
  order: (col: string, opts: { ascending: boolean }) => LooseQuery;
  limit: (n: number) => Promise<{ data: Row[] | null; error: { message: string } | null }>;
}

/**
 * Loads approved bills from Supabase. Starts with sample bills so the deck
 * renders instantly, and keeps samples if the backend is empty or unreachable.
 */
export function useApprovedBills() {
  const [bills, setBills] = useState<ApprovedBill[]>(SAMPLE_BILLS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSamples, setUsingSamples] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Loose typing: generated DB types may not include the bills table yet.
        const client = supabase as unknown as { from: (table: string) => LooseQuery };
        const { data, error: qErr } = await client
          .from("bills")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(50);
        if (cancelled) return;
        if (qErr) {
          setError(qErr.message);
          return;
        }
        const live = (data ?? [])
          .map(mapBillRow)
          .filter((b): b is ApprovedBill => b !== null && b.goal > 0);
        if (live.length > 0) {
          setBills(live);
          setUsingSamples(false);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load bills");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { bills, loading, error, usingSamples };
}
