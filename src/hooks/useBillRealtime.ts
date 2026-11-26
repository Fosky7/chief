import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sampleBills } from "@/lib/sampleBills";

export type RealtimeBillRow = {
  id: string;
  raised_amount?: number | null;
  amount_raised?: number | null;
  status?: string | null;
};

export type RealtimeDonationRow = {
  id: string;
  bill_id: string;
  amount: number;
  status: string;
  paystack_reference?: string | null;
  payment_reference?: string | null;
};

type Handlers = {
  onBill?: (row: RealtimeBillRow) => void;
  onDonation?: (row: RealtimeDonationRow) => void;
};

export interface BillDetail {
  id: string;
  title: string;
  story: string;
  biller: string;
  dueDate: string | null;
  goal: number;
  raised: number;
  status: BillStatus;
  category: string;
  city: string;
  requesterName: string | null;
  imageUrl: string | null;
  donorCount: number | null;
}

export type BillStatus = "pending" | "approved" | "rejected" | "funded" | "paid" | string;

export type BillDetailState = {
  bill: BillDetail | null;
  loading: boolean;
  error: string | null;
  live: boolean;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = Record<string, unknown>;

function pickNum(row: Row, keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v === undefined || v === null || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function pickStr(row: Row, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

function toDetail(row: Row): BillDetail {
  return {
    id: String(row.id),
    title: pickStr(row, ["title", "name"], "Untitled bill"),
    story: pickStr(row, ["story", "description", "summary"]),
    biller: pickStr(row, ["biller_name", "biller", "payee"], "Verified biller"),
    dueDate: pickStr(row, ["due_date"]) || null,
    goal: pickNum(row, ["amount_needed", "goal_amount", "target_amount", "goal", "amount"]),
    raised: Math.max(pickNum(row, ["amount_raised"]), pickNum(row, ["raised_amount"]), pickNum(row, ["raised"])),
    status: pickStr(row, ["status"], "pending"),
    category: pickStr(row, ["category"], "General"),
    city: pickStr(row, ["city", "location", "state"]),
    requesterName: pickStr(row, ["requester_name", "submitted_by_name"]) || null,
    imageUrl: pickStr(row, ["image_url", "image", "photo_url", "cover_url"]) || null,
    donorCount: null,
  };
}

function sampleDetail(id: string): BillDetail | null {
  const s = sampleBills.find((b) => b.id === id || b.id === `sample-${id}`);
  if (!s) return null;
  return {
    id: s.id,
    title: s.title,
    story: s.description,
    biller: "Verified biller",
    dueDate: null,
    goal: s.goal,
    raised: s.raised,
    status: "approved",
    category: s.category,
    city: s.city,
    requesterName: null,
    imageUrl: s.image,
    donorCount: null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** Loads one bill (detail page) and keeps it live. */
function useBillDetail(id: string | null): BillDetailState {
  const [state, setState] = useState<BillDetailState>({ bill: null, loading: id !== null, error: null, live: false });

  useEffect(() => {
    if (id === null) return;
    let active = true;
    setState({ bill: null, loading: true, error: null, live: false });

    if (!UUID_RE.test(id)) {
      setState({ bill: sampleDetail(id), loading: false, error: null, live: false });
      return;
    }

    (async () => {
      try {
        const { data, error } = await db.from("bills").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        if (!active) return;
        setState((s) => ({ ...s, bill: data ? toDetail(data as Row) : null, loading: false }));
      } catch (e) {
        if (!active) return;
        setState((s) => ({ ...s, bill: null, loading: false, error: e instanceof Error ? e.message : "Could not load bill" }));
      }
    })();

    const channel = supabase
      .channel(`bill-detail-${id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes" as never,
        { event: "UPDATE", schema: "public", table: "bills", filter: `id=eq.${id}` },
        (payload: { new: Row }) => {
          if (!payload?.new || !active) return;
          setState((s) => ({ ...s, bill: toDetail(payload.new) }));
        },
      )
      .subscribe((status: string) => {
        if (active && status === "SUBSCRIBED") setState((s) => ({ ...s, live: true }));
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [id]);

  return state;
}

/** Subscribes to live bill + donation changes for a list of bill ids. */
function useBillsSubscription(billIds: string[], handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const ids = billIds.filter((id) => UUID_RE.test(id));
  const key = [...ids].sort().join(",");

  useEffect(() => {
    if (!key) return;
    const filter = `id=in.(${key})`;
    const donationFilter = `bill_id=in.(${key})`;

    const channel = supabase
      .channel(`bill-realtime-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes" as never,
        { event: "UPDATE", schema: "public", table: "bills", filter },
        (payload: { new: RealtimeBillRow }) => {
          if (payload?.new) handlersRef.current.onBill?.(payload.new);
        },
      )
      .on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: "donations", filter: donationFilter },
        (payload: { new: RealtimeDonationRow }) => {
          if (payload?.new && (payload.new as RealtimeDonationRow).bill_id) {
            handlersRef.current.onDonation?.(payload.new);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [key]);
}

/**
 * - `useBillRealtime(id)` loads a single bill for the detail page and keeps it live.
 * - `useBillRealtime(ids, handlers)` subscribes to bill/donation changes for discover cards.
 * RLS still applies to every event delivered.
 */
export function useBillRealtime(id: string): BillDetailState;
export function useBillRealtime(billIds: string[], handlers: Handlers): void;
export function useBillRealtime(arg: string | string[], handlers?: Handlers): BillDetailState | void {
  const isSingle = typeof arg === "string";
  const detail = useBillDetail(isSingle ? (arg as string) : null);
  useBillsSubscription(isSingle ? [] : (arg as string[]), handlers ?? {});
  if (isSingle) return detail;
}

export default useBillRealtime;
