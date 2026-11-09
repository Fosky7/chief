import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeBill, type AdminQueueBill } from "@/services/admin";

const APPROVED_STATUSES = ["approved", "Approved"];

export function useApprovedBills() {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from("bills")
      .select("*")
      .in("status", APPROVED_STATUSES)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setBills((data ?? []).map(normalizeBill));
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    refresh();

    const channel = supabase
      .channel("approved-bills-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bills" },
        () => {
          if (active) refresh();
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { bills, loading, error, refresh };
}
