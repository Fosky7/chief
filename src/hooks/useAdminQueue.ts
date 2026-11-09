import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminQueue,
  fetchPendingDonations,
  isCurrentUserAdmin,
  type AdminDonation,
  type AdminQueueBill,
} from "@/services/admin";

export function useAdminQueue() {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const admin = await isCurrentUserAdmin();
      setIsAdmin(admin);

      if (!admin) {
        setBills([]);
        setDonations([]);
        return;
      }

      const [queue, pendingDonations] = await Promise.all([
        fetchAdminQueue(),
        fetchPendingDonations(),
      ]);

      setBills(queue);
      setDonations(pendingDonations);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the review queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { bills, donations, isAdmin, loading, error, reload };
}
