import { useCallback, useEffect, useState } from "react";
import {
  AdminAction,
  AdminFeedback,
  AdminQueueBill,
  AdminQueueStatus,
  QUEUE_ERROR_MESSAGE,
  approveBill,
  fetchAdminQueue,
  payoutBill,
  rejectBill,
} from "@/services/admin";

function nextStatus(action: AdminAction): AdminQueueStatus {
  if (action === "approve") return "approved";
  if (action === "reject") return "rejected";
  return "paid";
}

export function useAdminQueue() {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminQueue();
      setBills(data);
    } catch {
      setBills([]);
      setError(QUEUE_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = useCallback(async (action: AdminAction, bill: AdminQueueBill) => {
    setBusyId(bill.id);
    try {
      const handler =
        action === "approve" ? approveBill : action === "reject" ? rejectBill : payoutBill;
      const result = await handler(bill);
      setFeedback(result);
      if (result.ok) {
        const status = nextStatus(action);
        setBills((previous) =>
          previous.map((entry) => (entry.id === bill.id ? { ...entry, status } : entry)),
        );
      }
      return result;
    } catch {
      const failure: AdminFeedback = {
        ok: false,
        action,
        billId: bill.id,
        message: QUEUE_ERROR_MESSAGE,
      };
      setFeedback(failure);
      return failure;
    } finally {
      setBusyId(null);
    }
  }, []);

  const approve = useCallback((bill: AdminQueueBill) => run("approve", bill), [run]);
  const reject = useCallback((bill: AdminQueueBill) => run("reject", bill), [run]);
  const payout = useCallback((bill: AdminQueueBill) => run("payout", bill), [run]);
  const clearFeedback = useCallback(() => setFeedback(null), []);

  return {
    bills,
    loading,
    error,
    feedback,
    busyId,
    reload: load,
    approve,
    reject,
    payout,
    clearFeedback,
  };
}
