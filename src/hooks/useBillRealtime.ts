import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Untyped view of the client so flexible column names don't fight generated types. */
const db = supabase as unknown as SupabaseClient;

type Row = Record<string, unknown>;

export type BillDetail = {
  id: string;
  title: string;
  story: string;
  category: string;
  city: string;
  biller: string;
  dueDate: string | null;
  goal: number;
  raised: number;
  status: string;
  imageUrl: string | null;
  requesterName: string | null;
  donorCount: number | null;
  createdAt: string | null;
};

/** Statuses that are visible and donatable on /discover. */
export const DISCOVERABLE_STATUSES = ["approved", "funded"];

function num(row: Row, keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function str(row: Row, keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return null;
}

/** Map a raw `bills` row (with tolerant column naming) to a BillDetail. */
export function mapBillRow(row: Row): BillDetail {
  const donorCountRaw = row.donor_count ?? row.donors_count;
  return {
    id: String(row.id),
    title: str(row, ["title", "name"]) ?? "Untitled bill",
    story: str(row, ["story", "description"]) ?? "",
    category: str(row, ["category"]) ?? "Other",
    city: str(row, ["city", "location", "state"]) ?? "Nigeria",
    biller: str(row, ["biller_name", "biller"]) ?? "Biller not set",
    dueDate: str(row, ["due_date", "due_on"]),
    goal: num(row, ["amount_needed", "goal_amount", "target_amount", "amount", "goal"]),
    raised: num(row, ["amount_raised", "raised_amount", "funded_amount", "raised"]),
    status: str(row, ["status"]) ?? "pending",
    imageUrl: str(row, ["image_url", "proof_url", "cover_url", "photo_url"]),
    requesterName: str(row, ["requester_name", "submitted_by_name"]),
    donorCount:
      donorCountRaw !== undefined && donorCountRaw !== null && !Number.isNaN(Number(donorCountRaw))
        ? Number(donorCountRaw)
        : null,
    createdAt: str(row, ["created_at"]),
  };
}

/** Live single-bill subscription used by the bill details page. */
export function useBillRealtime(id: string) {
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error: err } = await db.from("bills").select("*").eq("id", id).maybeSingle();
      if (err) throw err;
      setBill(data ? mapBillRow(data as Row) : null);
      setError(null);
    } catch (e) {
      setBill(null);
      setError(e instanceof Error ? e.message : "Could not load this bill");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    void load();
    const channel = supabase
      .channel(`bill-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bills", filter: `id=eq.${id}` },
        (payload) => {
          const next = payload.new as Row | undefined;
          if (next && next.id) setBill(mapBillRow(next));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "donations", filter: `bill_id=eq.${id}` },
        () => void load(),
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [id, load]);

  return { bill, loading, error, live, reload: load };
}

/** Live list of discoverable bills for /discover. Updates raised amounts in place. */
export function useDiscoverBills() {
  const [bills, setBills] = useState<BillDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error: err } = await db.from("bills").select("*").in("status", DISCOVERABLE_STATUSES);
      if (err) throw err;
      const mapped = ((data ?? []) as Row[]).map(mapBillRow);
      mapped.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
      setBills(mapped);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load bills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("discover-bills")
      .on("postgres_changes", { event: "*", schema: "public", table: "bills" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const oldId = (payload.old as Row | undefined)?.id;
          if (oldId) setBills((list) => list.filter((b) => b.id !== String(oldId)));
          return;
        }
        const next = payload.new as Row | undefined;
        if (!next || !next.id) return;
        const mapped = mapBillRow(next);
        setBills((list) => {
          const visible = DISCOVERABLE_STATUSES.includes(mapped.status);
          const exists = list.some((b) => b.id === mapped.id);
          if (!visible) return list.filter((b) => b.id !== mapped.id);
          if (exists) return list.map((b) => (b.id === mapped.id ? mapped : b));
          return [mapped, ...list];
        });
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return { bills, loading, error, live, reload: load };
}
