import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveBill,
  fetchAdminQueue,
  isCurrentUserAdmin,
  payoutBill,
  rejectBill,
  summariseQueue,
  QUEUE_ERROR_MESSAGE,
  type AdminAction,
  type AdminFeedback,
  type AdminQueueBill,
} from "@/services/admin";

export interface UseAdminQueueResult {
  bills: AdminQueueBill[];
  summary: ReturnType<typeof summariseQueue>;
  loading: boolean;
  error: string | null;
  feedback: AdminFeedback | null;
  isAdmin: boolean;
  pendingId: string | null;
  runAction: (action: AdminAction, bill: AdminQueueBill) => Promise<void>;
  clearFeedback: () => void;
  refresh: () => Promise<void>;
}

export function useAdminQueue(): UseAdminQueueResult {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await fetchAdminQueue();
      setBills(snapshot.bills);
      setError(snapshot.notice ?? null);
    } catch {
      setError(QUEUE_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    let active = true;
    void isCurrentUserAdmin().then((value) => {
      if (active) setIsAdmin(value);
    });
    return () => {
      active = false;
    };
  }, [load]);

  const runAction = useCallback(async (action: AdminAction, bill: AdminQueueBill) => {
    setPendingId(bill.id);
    try {
      const runner = action === "approve" ? approveBill : action === "reject" ? rejectBill : payoutBill;
      const result = await runner(bill);
      setFeedback(result);
      setBills((prev) =>
        prev.map((item) =>
          item.id === bill.id
            ? {
                ...item,
                status: result.status,
                fundedNaira: action === "payout" ? item.amountNaira : item.fundedNaira,
              }
            : item,
        ),
      );
    } catch {
      setError(QUEUE_ERROR_MESSAGE);
    } finally {
      setPendingId(null);
    }
  }, []);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const summary = useMemo(() => summariseQueue(bills), [bills]);

  return {
    bills,
    summary,
    loading,
    error,
    feedback,
    isAdmin,
    pendingId,
    runAction,
    clearFeedback,
    refresh: load,
  };
}
