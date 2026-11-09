import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Subscribes to live changes on a single bill row and calls onChange with the new row. */
export function useBillRealtime(
  billId: string | undefined | null,
  onChange: (row: Record<string, unknown>) => void,
) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    if (!billId) return;
    const channel = supabase
      .channel(`bill-${billId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bills", filter: `id=eq.${billId}` },
        (payload) => {
          const row = (payload.new ?? {}) as Record<string, unknown>;
          if (row && Object.keys(row).length > 0) cb.current(row);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [billId]);
}

export default useBillRealtime;
