import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveBill,
  fetchAdminQueue,
  isCurrentUserAdmin,
  payoutBill,
  rejectBill,
  summariseQueue,
  type AdminFeedback,
  type AdminQueueBill,
} from "@/services/admin";

export type AdminQueueAction = "approve" | "reject" | "payout";

export function useAdminQueue() {
  const [queue, setQueue] = useState<AdminQueueBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const admin = await isCurrentUserAdmin();
      setIsAdmin(admin);

      if (!admin) {
        setQueue([]);
        return;
      }

      const rows = await fetchAdminQueue();
      setQueue(rows);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not load the admin review queue. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = useCallback(
    async (billId: string, action: AdminQueueAction): Promise<AdminFeedback> => {
      setBusyId(billId);

      try {
        let result: AdminFeedback;

        if (action === "approve") result = await approveBill(billId);
        else if (action === "reject") result = await rejectBill(billId);
        else result = await payoutBill(billId);

        setFeedback(result);
        if (result.ok) await refresh();
        return result;
      } catch (caught) {
        const result: AdminFeedback = {
          ok: false,
          message:
            caught instanceof Error
              ? caught.message
              : "Could not update this bill. Please try again.",
        };
        setFeedback(result);
        return result;
      } finally {
        setBusyId(null);
      }
    },
    [refresh],
  );

  const summary = useMemo(() => summariseQueue(queue), [queue]);

  return {
    queue,
    bills: queue,
    loading,
    error,
    isAdmin,
    feedback,
    busyId,
    summary,
    refresh,
    approve: (id: string) => runAction(id, "approve"),
    reject: (id: string) => runAction(id, "reject"),
    payout: (id: string) => runAction(id, "payout"),
    runAction,
  };
}
