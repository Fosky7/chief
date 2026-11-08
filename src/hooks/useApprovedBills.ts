import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { liveSampleBills, type BillCategory } from "@/lib/sampleBills";

/** Shape consumed by the discover deck. */
export interface DeckBill {
  id: string;
  title: string;
  category: BillCategory;
  city: string;
  raised: number;
  goal: number;
  imageUrl: string | null;
  story: string;
  biller: string;
  dueDate: string | null;
  /** True when the bill comes from local sample data, not the backend. */
  isSample: boolean;
}

export interface UseApprovedBillsResult {
  bills: DeckBill[];
  loading: boolean;
  error: string | null;
  /** True when the deck is showing sample bills. */
  usingSample: boolean;
  refresh: () => Promise<void>;
}

const CATEGORIES: BillCategory[] = ["Education", "Health", "Housing", "Utilities"];

const SAMPLE_DECK: DeckBill[] = liveSampleBills.map((b) => ({
  id: b.id,
  title: b.title,
  category: b.category,
  city: b.city,
  raised: b.raised,
  goal: b.goal,
  imageUrl: b.imageUrl,
  story: b.story,
  biller: b.biller,
  dueDate: b.dueDate,
  isSample: true,
}));

type Row = Record<string, unknown>;

function pick(row: Row, keys: string[]): unknown {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k];
  }
  return undefined;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normaliseCategory(v: unknown): BillCategory {
  const s = str(v).toLowerCase();
  if (s.includes("school") || s.includes("educ")) return "Education";
  if (s.includes("hosp") || s.includes("health") || s.includes("medic")) return "Health";
  if (s.includes("rent") || s.includes("hous")) return "Housing";
  if (s.includes("util") || s.includes("electric") || s.includes("water")) return "Utilities";
  return CATEGORIES.find((c) => c.toLowerCase() === s) ?? "Utilities";
}

/**
 * Maps a backend row to a DeckBill. Reads columns defensively because the
 * amount columns may be stored either in Naira or in kobo.
 */
function toDeckBill(row: Row): DeckBill | null {
  const id = str(row.id);
  if (!id) return null;

  let goal = num(pick(row, ["goal", "amount_needed", "goal_amount", "amount", "target_amount"]));
  let raised = num(pick(row, ["raised", "amount_raised", "raised_amount"]));
  const goalKobo = pick(row, ["goal_kobo", "amount_kobo", "amount_needed_kobo"]);
  const raisedKobo = pick(row, ["raised_kobo", "amount_raised_kobo"]);
  if (!goal && goalKobo !== undefined) goal = Math.round(num(goalKobo) / 100);
  if (!raised && raisedKobo !== undefined) raised = Math.round(num(raisedKobo) / 100);
  if (goal <= 0) return null;

  return {
    id,
    title: str(pick(row, ["title", "name"]), "Untitled bill"),
    category: normaliseCategory(pick(row, ["category", "bill_type", "type"])),
    city: str(pick(row, ["city", "location", "state"]), "Nigeria"),
    raised,
    goal,
    imageUrl: (pick(row, ["image_url", "photo_url", "cover_url", "image"]) as string | undefined) ?? null,
    story: str(pick(row, ["story", "description"])),
    biller: str(pick(row, ["biller", "biller_name", "payee"]), "Verified biller"),
    dueDate: (pick(row, ["due_date", "due_at"]) as string | undefined) ?? null,
    isSample: false,
  };
}

/**
 * Loads approved, not-yet-funded bills for the discover deck.
 * Starts with sample bills so the deck is never empty, then swaps in live
 * data when the backend returns approved bills. Any backend failure keeps the
 * sample deck in place rather than crashing the page.
 */
export function useApprovedBills(limit = 50): UseApprovedBillsResult {
  const [bills, setBills] = useState<DeckBill[]>(SAMPLE_DECK);
  const [usingSample, setUsingSample] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: queryError } = await supabase
        .from("bills")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!mounted.current) return;
      if (queryError) throw queryError;

      const live = ((data ?? []) as Row[])
        .map(toDeckBill)
        .filter((b): b is DeckBill => b !== null && b.raised < b.goal);

      if (live.length > 0) {
        setBills(live);
        setUsingSample(false);
      } else {
        setBills(SAMPLE_DECK);
        setUsingSample(true);
      }
      setError(null);
    } catch (e) {
      if (!mounted.current) return;
      setBills(SAMPLE_DECK);
      setUsingSample(true);
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

  return { bills, loading, error, usingSample, refresh: load };
}

export default useApprovedBills;
