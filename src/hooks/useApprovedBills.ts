import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApprovedBill {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  amount_needed: number;
  amount_raised: number;
  imageUrl: string;
  amountNeeded: number;
  amountRaised: number;
  isSample?: boolean;
}

function makeBill(raw: Record<string, unknown>, isSample = false): ApprovedBill {
  const needed = Number(raw.amount_needed ?? raw.amountNeeded ?? raw.amount ?? raw.goal_amount ?? 0) || 0;
  const raised = Number(raw.amount_raised ?? raw.amountRaised ?? raw.raised_amount ?? 0) || 0;
  const image = String(
    raw.image_url ?? raw.imageUrl ?? raw.photo_url ??
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=60",
  );
  return {
    id: String(raw.id ?? Math.random().toString(36).slice(2)),
    title: String(raw.title ?? "Untitled bill"),
    description: String(raw.description ?? ""),
    category: String(raw.category ?? "General"),
    image_url: image,
    imageUrl: image,
    amount_needed: needed,
    amountNeeded: needed,
    amount_raised: raised,
    amountRaised: raised,
    isSample,
  };
}

export const FALLBACK_APPROVED_BILLS: ApprovedBill[] = [
  makeBill({ id: "sample-1", title: "School fees for Amaka", description: "Second term fees for secondary school.", category: "Education", image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=60", amount_needed: 150000, amount_raised: 45000 }, true),
  makeBill({ id: "sample-2", title: "Hospital bill for Tunde", description: "Surgery recovery and medication.", category: "Health", image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=60", amount_needed: 320000, amount_raised: 128500 }, true),
  makeBill({ id: "sample-3", title: "Rent support for Mama Ngozi", description: "Three months of rent after job loss.", category: "Housing", image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=60", amount_needed: 210000, amount_raised: 12000 }, true),
];

async function fetchApprovedBills(): Promise<ApprovedBill[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("bills")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (error || !Array.isArray(data) || data.length === 0) {
      return FALLBACK_APPROVED_BILLS;
    }
    return data.map((row: Record<string, unknown>) => makeBill(row));
  } catch {
    return FALLBACK_APPROVED_BILLS;
  }
}

export function useApprovedBills() {
  const query = useQuery({
    queryKey: ["approved-bills"],
    queryFn: fetchApprovedBills,
    placeholderData: FALLBACK_APPROVED_BILLS,
    retry: false,
  });
  const bills = query.data && query.data.length > 0 ? query.data : FALLBACK_APPROVED_BILLS;
  return {
    ...query,
    data: bills,
    bills,
    isSample: bills.every((b) => b.isSample),
    isLoading: false,
  };
}

export default useApprovedBills;

export type BillCategory = string;

// Kept: still used by other files.
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
