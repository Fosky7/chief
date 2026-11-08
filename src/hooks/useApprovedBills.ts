import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { liveSampleBills } from "@/lib/sampleBills";

export interface DeckBill {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  imageUrl?: string;
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toDeckBill(raw: any): DeckBill {
  return {
    id: String(raw?.id ?? ""),
    title: String(raw?.title ?? raw?.name ?? "Untitled bill"),
    description: String(raw?.description ?? raw?.summary ?? raw?.story ?? ""),
    category: String(raw?.category ?? "General"),
    goal: num(raw?.goal_amount ?? raw?.amount_needed ?? raw?.goal ?? raw?.amount ?? raw?.target),
    raised: num(raw?.amount_raised ?? raw?.raised ?? raw?.funded ?? 0),
    imageUrl: raw?.image_url ?? raw?.imageUrl ?? raw?.image ?? undefined,
  };
}

function fallback(): DeckBill[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = (liveSampleBills as unknown as any[]) ?? [];
  return Array.isArray(list) ? list.map(toDeckBill).filter((b) => b.id) : [];
}

export function useApprovedBills() {
  return useQuery({
    queryKey: ["approved-bills"],
    queryFn: async (): Promise<DeckBill[]> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("bills")
          .select("*")
          .eq("status", "approved")
          .limit(50);
        if (error || !Array.isArray(data) || data.length === 0) return fallback();
        const mapped = data.map(toDeckBill).filter((b: DeckBill) => b.id);
        return mapped.length ? mapped : fallback();
      } catch {
        return fallback();
      }
    },
    staleTime: 30_000,
  });
}
