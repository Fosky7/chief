import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BillDetail {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  amount?: number | null;
  funded?: number | null;
  status?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface VoteRow {
  id?: string;
  bill_id?: string | null;
  user_id?: string | null;
  vote?: string | null;
  created_at?: string | null;
}

export interface VoteTally {
  total: number;
  yes: number;
  no: number;
  mine: "yes" | "no" | null;
}

export function useBillRealtime(billId?: string) {
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(billId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!billId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [billResult, voteResult, authResult] = await Promise.all([
      (supabase as any).from("bills").select("*").eq("id", billId).maybeSingle(),
      (supabase as any).from("votes").select("*").eq("bill_id", billId),
      supabase.auth.getUser(),
    ]);

    if (billResult?.error) {
      setError(billResult.error.message);
      setBill(null);
      setVotes([]);
      setLoading(false);
      return;
    }
    if (voteResult?.error) {
      setError(voteResult.error.message);
      setVotes([]);
    } else {
      setVotes((voteResult?.data ?? []) as VoteRow[]);
    }

    setBill((billResult?.data ?? null) as BillDetail | null);
    setCurrentUserId(authResult?.data?.user?.id ?? null);
    setLoading(false);
  }, [billId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!billId) return;
    const channel = supabase
      .channel(`bill-detail-${billId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `bill_id=eq.${billId}` },
        () => {
          void refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bills", filter: `id=eq.${billId}` },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [billId, refresh]);

  const tally = useMemo<VoteTally>(() => {
    const yes = votes.filter((row) => (row.vote ?? "").toLowerCase() === "yes").length;
    const no = votes.filter((row) => (row.vote ?? "").toLowerCase() === "no").length;
    const mineRow = currentUserId ? votes.find((row) => row.user_id === currentUserId) : undefined;
    const mineValue = (mineRow?.vote ?? "").toLowerCase();
    return {
      total: votes.length,
      yes,
      no,
      mine: mineValue === "yes" || mineValue === "no" ? (mineValue as "yes" | "no") : null,
    };
  }, [votes, currentUserId]);

  return { bill, votes, tally, currentUserId, loading, error, refresh };
}
