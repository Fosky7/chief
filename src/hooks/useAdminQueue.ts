import { useCallback, useEffect, useState } from "react";
import {
  approveBill,
  fetchAdminQueue,
  isCurrentUserAdmin,
  markBillPaid,
  rejectBill,
  type AdminQueueBill,
} from "@/services/admin";

export type UseAdminQueueResult = {
  bills: AdminQueueBill[];
  isAdmin: boolean | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
};

export function useAdminQueue(): UseAdminQueueResult {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const admin = await isCurrentUserAdmin();
      setIsAdmin(admin);

      if (!admin) {
        setBills([]);
        return;
      }

      const queue = await fetchAdminQueue();
      setBills(queue);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the review queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approve = useCallback(
    async (id: string) => {
      await approveBill(id);
      await refresh();
    },
    [refresh],
  );

  const reject = useCallback(
    async (id: string) => {
      await rejectBill(id);
      await refresh();
    },
    [refresh],
  );

  const markPaid = useCallback(
    async (id: string) => {
      await markBillPaid(id);
      await refresh();
    },
    [refresh],
  );

  return { bills, isAdmin, loading, error, refresh, approve, reject, markPaid };
}
