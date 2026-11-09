import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sampleBills, type SampleBill } from "@/lib/sampleBills";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): SampleBill {
  return {
    ...row,
    id: String(row.id),
    title: row.title ?? "Untitled bill",
    summary: row.summary ?? row.description ?? "",
    category: row.category ?? "General",
    location: row.location ?? "",
    amount: Number(row.amount ?? row.goal ?? 0),
    raised: Number(row.raised ?? 0),
    backers: Number(row.backers ?? 0),
    imageUrl: row.image_url ?? row.imageUrl ?? "",
    requester: row.requester ?? row.requester_name ?? "",
    dueDate: row.due_date ?? row.dueDate ?? "",
  };
}

export function useApprovedBills() {
  const [bills, setBills] = useState<SampleBill[]>(sampleBills);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"sample" | "live">("sample");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("bills")
          .select("*")
          .eq("status", "approved");
        if (!active) return;
        if (!error && Array.isArray(data) && data.length > 0) {
          setBills(data.map(mapRow));
          setSource("live");
        }
      } catch {
        // fall back to sample bills
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { bills, loading, source };
}
