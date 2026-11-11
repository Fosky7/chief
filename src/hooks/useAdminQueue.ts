/**
 * State hook for the admin review queue.
 *
 * Owns loading the queue, the admin role probe, optimistic status updates after
 * a successful review action, and the feedback banner copy. The page stays a
 * pure render of this state.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminActionMessage,
  adminActionStatus,
  approveBill,
  canMarkPaid,
  fetchAdminQueue,
  isBillPendingReview,
  isCurrentUserAdmin,
  payoutBill,
  QUEUE_ERROR_MESSAGE,
  rejectBill,
} from "@/services/admin";
import type { AdminAction, AdminFeedback, AdminQueueBill, AdminQueueSummary } from "@/types";

export interface UseAdminQueueResult {
  bills: AdminQueueBill[];
  isLoading: boolean;
  isAdmin: boolean;
  feedback: AdminFeedback | null;
  pendingActionId: string | null;
  summary: AdminQueueSummary;
  runAction: (bill: AdminQueueBill, action: AdminAction) => Promise<void>;
}

export function useAdminQueue(): UseAdminQueueResult {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Resolve the role first: once `isLoading` flips to false the role is
      // known, so the "Admins only" gate never flickers for admins.
      try {
        const admin = await isCurrentUserAdmin();
        if (!cancelled) setIsAdmin(admin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }

      try {
        const queue = await fetchAdminQueue();
        if (!cancelled) setBills(queue);
      } catch (error) {
        if (!cancelled) {
          setFeedback({
            message: error instanceof Error ? error.message : QUEUE_ERROR_MESSAGE,
            tone: "error",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const applyStatus = useCallback((billId: string, status: string) => {
    setBills((current) =>
      current.map((bill) => (bill.id === billId ? { ...bill, status } : bill)),
    );
  }, []);

  const runAction = useCallback(
    async (bill: AdminQueueBill, action: AdminAction) => {
      if (pendingActionId) return;

      setPendingActionId(bill.id);
      setFeedback(null);

      try {
        if (action === "approve") await approveBill(bill.id);
        else if (action === "reject") await rejectBill(bill.id);
        else await payoutBill(bill.id);

        applyStatus(bill.id, adminActionStatus(action));
        setFeedback({ message: adminActionMessage(action), tone: "success" });
      } catch (error) {
        setFeedback({
          message:
            error instanceof Error ? error.message : "That action could not be completed",
          tone: "error",
        });
      } finally {
        setPendingActionId(null);
      }
    },
    [applyStatus, pendingActionId],
  );

  const summary = useMemo<AdminQueueSummary>(() => {
    const pending = bills.filter(isBillPendingReview).length;
    const funded = bills.filter(canMarkPaid).length;
    const total = bills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    return { pending, funded, total };
  }, [bills]);

  return { bills, isLoading, isAdmin, feedback, pendingActionId, summary, runAction };
}

export default useAdminQueue;
