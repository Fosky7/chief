import { useCallback, useEffect, useState } from "react";

import {
  approveBill,
  fetchAdminQueue,
  fetchApprovedDonations,
  isCurrentUserAdmin,
  markBillPaid,
  rejectBill,
  type AdminDonation,
  type AdminQueueBill,
} from "@/services/admin";

export interface UseAdminQueueResult {
  bills: AdminQueueBill[];
  donations: AdminDonation[];
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  pendingCount: number;
  refresh: () => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string) => Promise<void>;
  markPaid: (id: string) => Promise<void>;
}

export function useAdminQueue(): UseAdminQueueResult {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const admin = await isCurrentUserAdmin();
      setIsAdmin(admin);

      const queue = await fetchAdminQueue();
      setBills(queue);

      if (admin) {
        setDonations(await fetchApprovedDonations());
      } else {
        setDonations([]);
      }
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

  const pendingCount = bills.filter((bill) => bill.status === "pending").length;

  return {
    bills,
    donations,
    isAdmin,
    loading,
    error,
    pendingCount,
    refresh,
    approve,
    reject,
    markPaid,
  };
}

export default useAdminQueue;
