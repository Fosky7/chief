import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sampleBills, type SampleBill } from "@/lib/sampleBills";

/** Normalized bill shape consumed by the discover deck. */
export type ApprovedBill = SampleBill;

export type UseApprovedBillsResult = {
  bills: ApprovedBill[];
  loading: boolean;
  error: string | null;
  /** True when showing fallback sample data instead of live bills. */
  isSample: boolean;
  refresh: () => Promise<void>;
};

type Row = Record<string, unknown>;

function pickNumber(row: Row, keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

function pickString(row: Row, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return fallback;
}

function toApprovedBill(row: Row, i: number): ApprovedBill {
  const image = pickString(row, ["image_url", "image", "photo_url", "imageUrl"]);
  return {
    id: String(row.id ?? `bill-${i}`),
    title: pickString(row, ["title", "name"], "Untitled bill"),
    description: pickString(row, ["description", "story", "summary"]),
    category: pickString(row, ["category"], "General"),
    city: pickString(row, ["city", "location"]),
    goal: pickNumber(row, ["amount_needed", "goal_amount", "target_amount", "amount", "goal"]),
    raised: pickNumber(row, ["amount_raised", "raised_amount", "funded_amount", "raised"]),
    image: image || null,
  };
}

// Loosely-typed view of the client so this hook compiles regardless of the
// generated Database typings for the `bills` table.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as unknown as { from: (table: string) => any };

/**
 * Loads approved bills from the backend. Falls back to sample bills when the
 * request fails or returns nothing, so the deck is never empty.
 */
export function useApprovedBills(): UseApprovedBillsResult {
  const [bills, setBills] = useState<ApprovedBill[]>(sampleBills);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSample, setIsSample] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data, error: err } = await db
        .from("bills")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (err) throw err;
      const rows = Array.isArray(data) ? (data as Row[]) : [];
      if (rows.length > 0) {
        setBills(rows.map(toApprovedBill));
        setIsSample(false);
      } else {
        setBills(sampleBills);
        setIsSample(true);
      }
      setError(null);
    } catch (e) {
      setBills(sampleBills);
      setIsSample(true);
      setError(e instanceof Error ? e.message : "Could not load bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void refresh();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel("approved-bills")
        .on("postgres_changes", { event: "*", schema: "public", table: "bills" }, () => {
          if (active) void refresh();
        })
        .subscribe();
    } catch {
      /* realtime unavailable — static list is fine */
    }
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { bills, loading, error, isSample, refresh };
}

export default useApprovedBills;
