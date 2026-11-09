import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      const user = authError ? null : data.user;
      setAuthenticated(Boolean(user));
      if (!user) {
        setBills([]);
        setIsAdmin(false);
        return;
      }
      const admin = await isCurrentUserAdmin();
      setIsAdmin(admin);
      if (admin) {
        setBills(await fetchAdminQueue());
      } else {
        setBills([]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load the review queue.');
      setBills([]);
    } finally {
      setAuthLoading(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = useCallback(
    async (billId: string, action: (id: string) => Promise<void>, message: string) => {
      setError(null);
      try {
        await action(billId);
        setBills((current) => current.filter((bill) => bill.id !== billId));
        setActionMessage(message);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'The action could not be completed.');
      }
    },
    [],
  );

  const approve = useCallback(
    (billId: string) => runAction(billId, approveBill, 'Bill approved'),
    [runAction],
  );
  const reject = useCallback(
    (billId: string) => runAction(billId, rejectBill, 'Bill rejected'),
    [runAction],
  );
  const markPaid = useCallback(
    (billId: string) => runAction(billId, markBillPaid, 'Paid out'),
    [runAction],
  );

  return {
    bills,
    loading,
    authLoading,
    authenticated,
    isAdmin,
    error,
    actionMessage,
    approve,
    reject,
    markPaid,
    reload: load,
  };
}
