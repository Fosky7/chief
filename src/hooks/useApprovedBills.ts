import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, toWholeNaira } from "@/lib/currency";
import { SAMPLE_BILLS } from "@/lib/sampleBills";

/** Shape of a bill as shown in the discovery deck. */
export interface ApprovedBill {
  id: string;
  title: string;
  category: string;
  city: string;
  goal: number;
  raised: number;
  /** goal - raised, never negative. */
  needed: number;
  imageUrl: string | null;
  /** Alias of imageUrl for components that use `image`. */
  image: string | null;
  story: string;
  biller: string;
  dueDate: string | null;
  isSample: boolean;
}

/** Re-exported for the deck so callers can format amounts consistently. */
export const formatNairaAmount = formatNaira;

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
    if (v !== null && v !== undefined && v !== "") return toWholeNaira(v);
  }
  return 0;
}

/**
 * Map a database row to an ApprovedBill. Column names are read defensively so
 * the deck keeps working across minor schema variations.
 */
export function mapBillRow(row: Row): ApprovedBill {
  const goal = pickNumber(row, ["goal", "goal_amount", "amount", "amount_needed", "target_amount"]);
  const raised = pickNumber(row, ["raised", "raised_amount", "amount_raised", "funded_amount"]);
  const imageUrl = pickString(row, ["image_url", "photo_url", "image", "cover_url"]) || null;
  const dueRaw = row.due_date ?? row.dueDate ?? null;
  return {
    id: String(row.id ?? ""),
    title: pickString(row, ["title", "name"], "Untitled bill"),
    category: pickString(row, ["category", "bill_type", "type"], "Other"),
    city: pickString(row, ["city", "location", "state"], "Nigeria"),
    goal,
    raised,
    needed: Math.max(goal - raised, 0),
    imageUrl,
    image: imageUrl,
    story: pickString(row, ["story", "description"]),
    biller: pickString(row, ["biller", "biller_name", "payee"], "Verified biller"),
    dueDate: typeof dueRaw === "string" ? dueRaw : null,
    isSample: false,
  };
}

export interface UseApprovedBillsResult {
  bills: ApprovedBill[];
  loading: boolean;
  error: string | null;
  /** True when the deck is showing fallback sample bills. */
  usingSamples: boolean;
}

/**
 * Loads approved bills for the swipe deck. Starts with sample bills so the deck
 * is never blank, then swaps in live approved bills when any are available.
 */
export function useApprovedBills(limit = 50): UseApprovedBillsResult {
  const [bills, setBills] = useState<ApprovedBill[]>(SAMPLE_BILLS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSamples, setUsingSamples] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data, error: queryError } = await supabase
          .from("bills")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(limit);

        if (cancelled) return;
        if (queryError) throw queryError;

        const live = ((data ?? []) as Row[]).map(mapBillRow).filter((b) => b.id && b.goal > 0);
        if (live.length > 0) {
          setBills(live);
          setUsingSamples(false);
        } else {
          setBills(SAMPLE_BILLS);
          setUsingSamples(true);
        }
        setError(null);
      } catch (e) {
        if (cancelled) return;
        // Keep the sample deck visible; surface the error for diagnostics.
        setBills(SAMPLE_BILLS);
        setUsingSamples(true);
        setError(e instanceof Error ? e.message : "Could not load bills");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  return { bills, loading, error, usingSamples };
}
