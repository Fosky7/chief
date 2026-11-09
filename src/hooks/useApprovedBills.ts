import { useCallback, useEffect, useState } from "react";
import { fetchApprovedDonations, type AdminDonation } from "@/services/admin";
import { useAuth } from "@/hooks/useAuth";

export function useApprovedBills() {
  const { user, loading: authLoading } = useAuth();
  const [contributions, setContributions] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!user) {
      setContributions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setContributions(await fetchApprovedDonations(user.id));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load approved contributions.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) void reload();
  }, [authLoading, reload]);

  return { contributions, loading: loading || authLoading, error, reload };
}
