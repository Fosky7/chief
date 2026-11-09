import { useCallback, useEffect, useState } from 'react';
import {
  approveBill,
  fetchAdminQueue,
  isCurrentUserAdmin,
  markBillPaid,
  rejectBill,
  type AdminQueueBill,
} from '@/services/admin';

export function useAdminQueue() {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

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
      setBills(await fetchAdminQueue());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the review queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const replaceBill = useCallback((updated: AdminQueueBill) => {
    setBills((current) => current.map((bill) => (bill.id === updated.id ? updated : bill)));
  }, []);

  const approve = useCallback(async (id: string) => {
    const updated = await approveBill(id);
    replaceBill(updated);
    return updated;
  }, [replaceBill]);

  const reject = useCallback(async (id: string) => {
    const updated = await rejectBill(id);
    replaceBill(updated);
    return updated;
  }, [replaceBill]);

  const markPaid = useCallback(async (id: string) => {
    const updated = await markBillPaid(id);
    replaceBill(updated);
    return updated;
  }, [replaceBill]);

  return { bills, loading, error, isAdmin, refresh, approve, reject, markPaid };
}
