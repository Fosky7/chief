import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { liveSampleBills } from "@/lib/sampleBills";

export interface DeckBill {
  id: string;
  title: string;
  category: string;
  city: string;
  raised: number;
  goal: number;
  imageUrl: string;
}

/** Category-based fallback photos when a bill has no uploaded image. */
const categoryPhotos: Record<string, string> = {
  Education: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=70",
  Health: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=70",
  Housing: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=70",
  Utilities: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=900&q=70",
};
const defaultPhoto =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=70";

export function photoFor(category: string, url?: unknown): string {
  if (typeof url === "string" && url.trim()) return url;
  return categoryPhotos[category] ?? defaultPhoto;
}

/** Formats a number as Naira with thousands separators, e.g. ₦45,000. */
export function formatNairaAmount(n: number): string {
  const safe = Number.isFinite(n) ? Math.round(n) : 0;
  return `₦${safe.toLocaleString("en-NG")}`;
}

function toNumber(...values: unknown[]): number {
  for (const v of values) {
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n === "number" && Number.isFinite(n)) return n;
  }
  return 0;
}

function sampleDeck(): DeckBill[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (liveSampleBills as any[]).map((b) => ({
    id: String(b.id),
    title: String(b.title),
    category: String(b.category ?? "General"),
    city: String(b.city ?? ""),
    raised: toNumber(b.raised),
    goal: toNumber(b.goal),
    imageUrl: photoFor(String(b.category ?? ""), b.imageUrl ?? b.image_url ?? b.photo),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: Record<string, any>): DeckBill | null {
  if (!row?.id || !row?.title) return null;
  const category = String(row.category ?? "General");
  return {
    id: String(row.id),
    title: String(row.title),
    category,
    city: String(row.city ?? row.location ?? ""),
    raised: toNumber(row.amount_raised, row.raised, row.raised_amount),
    goal: toNumber(row.amount_needed, row.goal, row.goal_amount, row.amount),
    imageUrl: photoFor(category, row.image_url ?? row.photo_url ?? row.document_url),
  };
}

/**
 * Loads approved bills for the swipe deck. Falls back to curated sample bills
 * when the backend is unavailable or returns too few bills to swipe through.
 */
export function useApprovedBills() {
  const [bills, setBills] = useState<DeckBill[]>(() => sampleDeck());
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "sample">("sample");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Untyped access: generated types may not include the bills table yet.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any;
        const { data, error } = await client
          .from("bills")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(50);
        if (cancelled) return;
        if (error) throw error;
        const mapped = ((data ?? []) as Record<string, unknown>[])
          .map(mapRow)
          .filter((b): b is DeckBill => b !== null);
        if (mapped.length >= 2) {
          setBills(mapped);
          setSource("live");
        }
      } catch (err) {
        console.warn("[useApprovedBills] falling back to sample bills:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { bills, loading, source };
}
