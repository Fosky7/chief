import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  approveBill,
  fetchAdminQueue,
  isCurrentUserAdmin,
  markBillPaid,
  rejectBill,
  type AdminQueueBill,
} from "@/services/admin";

/** Re-exported so pages can type their props without reaching into the service. */
export type { AdminQueueBill } from "@/services/admin";

/**
 * Where the moderation workspace currently stands.
 *
 *  - loading    : we are still deciding whether this visitor may moderate
 *  - signed-out : nobody is signed in
 *  - not-admin  : signed in, but the profile does not carry a moderator role
 *  - ready      : the queue payload is loaded and actions are available
 */
export type AdminQueuePhase = "loading" | "signed-out" | "not-admin" | "ready";

export type AdminQueueState = {
  /** True only once the visitor is confirmed as a moderator AND the queue loaded. */
  isAdmin: boolean;
  /** True when the visitor must not see any moderation control. */
  blocked: boolean;
  phase: AdminQueuePhase;
  loading: boolean;
  error: string | null;
  /** Headline shown on the gate panel ("Admins only"). */
  gateMessage: string | null;
  /** Supporting sentence explaining why the gate is shown. */
  gateDetail: string | null;
  pendingBills: AdminQueueBill[];
  fundedBills: AdminQueueBill[];
  busyId: string | null;
  actionMessage: string | null;
  actionError: string | null;
  refresh: () => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
};

const GATE_MESSAGE = "Admins only";

function messageOf(cause: unknown, fallback: string): string {
  if (cause instanceof Error && cause.message.trim() !== "") return cause.message;
  if (typeof cause === "string" && cause.trim() !== "") return cause;
  return fallback;
}

/**
 * Admin review queue hook (Module 5).
 *
 * Owns the whole moderation workspace lifecycle: the signed-in check, the
 * admin-role gate, the queue payload, and the approve / reject / mark-paid
 * writes. Non-moderators never receive payload data or actionable controls
 * because the payload is simply not fetched for them.
 */
export function useAdminQueue(): AdminQueueState {
  const [phase, setPhase] = useState<AdminQueuePhase>("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingBills, setPendingBills] = useState<AdminQueueBill[]>([]);
  const [fundedBills, setFundedBills] = useState<AdminQueueBill[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Monotonic id so a slow, superseded refresh can never overwrite fresh state. */
  const requestRef = useRef(0);
  /** id → title map used to write friendly action confirmations. */
  const titleRef = useRef<Map<string, string>>(new Map());

  const load = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (requestRef.current !== requestId) return;
      if (userError) throw new Error(userError.message || "Could not read your session.");

      if (!userData.user) {
        setPhase("signed-out");
        setPendingBills([]);
        setFundedBills([]);
        return;
      }

      const admin = await isCurrentUserAdmin();
      if (requestRef.current !== requestId) return;
      if (!admin) {
        setPhase("not-admin");
        setPendingBills([]);
        setFundedBills([]);
        return;
      }

      const queue = await fetchAdminQueue();
      if (requestRef.current !== requestId) return;

      const titles = new Map<string, string>();
      for (const bill of [...queue.pending, ...queue.funded]) {
        titles.set(bill.id, bill.title);
      }
      titleRef.current = titles;

      setPendingBills(queue.pending);
      setFundedBills(queue.funded);
      setPhase("ready");
    } catch (cause) {
      if (requestRef.current !== requestId) return;
      setError(messageOf(cause, "Could not load the review queue."));
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      // Only react to real sign in / sign out transitions so the initial
      // session restore does not trigger a duplicate queue fetch.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        void load();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [load]);

  const runAction = useCallback(
    async (
      id: string,
      action: (billId: string) => Promise<void>,
      successPrefix: string,
      failureFallback: string,
    ) => {
      setBusyId(id);
      setActionMessage(null);
      setActionError(null);

      try {
        await action(id);
        const title = titleRef.current.get(id) ?? "the bill";
        setActionMessage(`${successPrefix} — ${title}.`);
        // Pull the fresh queue so the moderated bill leaves its section.
        await load();
      } catch (cause) {
        setActionError(messageOf(cause, failureFallback));
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const approve = useCallback(
    (id: string) =>
      runAction(id, approveBill, "Bill approved", "Could not approve this bill."),
    [runAction],
  );

  const reject = useCallback(
    (id: string) => runAction(id, rejectBill, "Bill rejected", "Could not reject this bill."),
    [runAction],
  );

  const markPaid = useCallback(
    (id: string) => runAction(id, markBillPaid, "Paid out", "Could not mark this bill as paid."),
    [runAction],
  );

  const isAdmin = phase === "ready";
  const blocked = phase === "signed-out" || phase === "not-admin";

  return {
    isAdmin,
    blocked,
    phase,
    loading,
    error,
    gateMessage: blocked ? GATE_MESSAGE : null,
    gateDetail:
      phase === "signed-out"
        ? "Sign in with a moderator account to approve or reject submissions."
        : phase === "not-admin"
          ? "Your account can browse and donate, but only moderators can approve or reject bills."
          : null,
    pendingBills,
    fundedBills,
    busyId,
    actionMessage,
    actionError,
    refresh: load,
    approve,
    reject,
    markPaid,
  };
}
