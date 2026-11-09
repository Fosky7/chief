import { useCallback, useEffect, useState } from "react";
import {
  approveBill,
  fetchAdminQueue,
  isCurrentUserAdmin,
  markBillPaid,
  rejectBill,
  type AdminQueueBill,
} from "@/services/admin";

export type { AdminQueueBill };

export function useAdminQueue() {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchAdminQueue();
      setBills(next);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the review queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      const admin = await isCurrentUserAdmin();
      if (!active) return;
      setIsAdmin(admin);
      setCheckingAdmin(false);
      if (admin) {
        await refresh();
      } else {
        setLoading(false);
      }
    };

    boot();
    return () => {
      active = false;
    };
  }, [refresh]);

  const runAction = useCallback(
    async (id: string, action: (billId: string) => Promise<unknown>) => {
      setPendingActionId(id);
      try {
        await action(id);
        await refresh();
      } finally {
        setPendingActionId(null);
      }
    },
    [refresh],
  );

  const approve = useCallback((id: string) => runAction(id, approveBill), [runAction]);
  const reject = useCallback((id: string) => runAction(id, rejectBill), [runAction]);
  const markPaid = useCallback((id: string) => runAction(id, markBillPaid), [runAction]);

  return {
    bills,
    queue: bills,
    loading,
    error,
    isAdmin,
    checkingAdmin,
    pendingActionId,
    refresh,
    approve,
    reject,
    markPaid,
  };
}
