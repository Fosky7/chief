import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getApprovedSampleBills, makeBill, type Bill, type BillStatus } from "@/lib/sampleBills";

export type { Bill } from "@/lib/sampleBills";
export type ApprovedBill = Bill;
export type DeckBill = Bill;

type AnyRecord = Record<string, unknown>;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=70";
const LOAD_TIMEOUT_MS = 8000;

function pickString(r: AnyRecord, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

function pickNumber(r: AnyRecord, keys: string[]): number {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

/** Map a live `bills` row (column names may vary) to the deck shape. */
export function normalizeBillRow(raw: unknown): Bill | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as AnyRecord;
  const id = pickString(r, ["id"]) || String(r.id ?? "");
  if (!id) return null;
  const status = pickString(r, ["status", "review_status"], "approved").toLowerCase() as BillStatus;
  return makeBill({
    id,
    title: pickString(r, ["title", "name"], "Untitled bill"),
    description: pickString(r, ["description", "summary", "details", "story"]),
    category: pickString(r, ["category", "type"], "Other"),
    city: pickString(r, ["city", "location", "state"]),
    goal: pickNumber(r, ["goal", "goal_amount", "amount_needed", "target", "needed", "amount"]),
    raised: pickNumber(r, ["raised", "raised_amount", "amount_raised", "funded", "funded_amount"]),
    image: pickString(r, ["image_url", "image", "photo_url", "photo", "cover_url"], FALLBACK_IMAGE),
    status,
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

async function fetchApprovedBills(): Promise<Bill[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = (supabase as any)
    .from("bills")
    .select("*")
    .eq("status", "approved")
    .limit(50);
  const { data, error } = (await withTimeout(Promise.resolve(query), LOAD_TIMEOUT_MS)) as {
    data: unknown[] | null;
    error: unknown;
  };
  if (error || !Array.isArray(data)) return [];
  return data
    .map(normalizeBillRow)
    .filter((b): b is Bill => !!b && b.status === "approved");
}

/**
 * Approved bills for the swipe deck. Uses live data when available and falls
 * back to realistic sample bills so the deck is never empty.
 */
export function useApprovedBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "sample" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let live: Bill[] = [];
      try {
        live = await fetchApprovedBills();
      } catch {
        live = [];
      }
      if (cancelled) return;
      if (live.length > 0) {
        setBills(live);
        setSource("live");
      } else {
        setBills(getApprovedSampleBills());
        setSource("sample");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { bills, loading, source };
}

export default useApprovedBills;
