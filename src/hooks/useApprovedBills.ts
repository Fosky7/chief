import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sampleBills, type BillDetail } from '@/lib/sampleBills';

function numberValue(value: unknown): number {
  const result = typeof value === 'number' || typeof value === 'string' ? Number(value) : 0;
  return Number.isFinite(result) ? Math.max(0, result) : 0;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalize(value: unknown): BillDetail | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = text(row.id);
  const title = text(row.title);
  const goal = numberValue(row.goal ?? row.target_amount ?? row.amount_needed ?? row.amount);
  if (!id || !title || goal <= 0) return null;
  const image = text(row.image ?? row.image_url ?? row.imageUrl);
  return {
    id,
    title,
    goal,
    raised: numberValue(row.raised ?? row.amount_raised ?? row.raised_amount ?? row.funded),
    description: text(row.description ?? row.summary),
    category: text(row.category, 'General'),
    city: text(row.city),
    image: /^https?:\/\//i.test(image) ? image : null,
    status: 'approved',
  };
}

export function useApprovedBills() {
  const [bills, setBills] = useState<BillDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [revision, setRevision] = useState(0);
  const refetch = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    async function load() {
      try {
        const response = await supabase.functions.invoke<{ bills: unknown[] }>('approved-bills', {
          body: {},
        });
        if (response.error) throw response.error;
        if (!Array.isArray(response.data?.bills)) throw new Error('Invalid bills response');
        const seen = new Set<string>();
        const approved = response.data.bills.map(normalize).filter((bill): bill is BillDetail => {
          if (!bill || seen.has(bill.id)) return false;
          seen.add(bill.id);
          return true;
        });
        if (!active) return;
        setBills(approved.length ? approved : sampleBills);
        setIsDemo(approved.length === 0);
      } catch {
        if (!active) return;
        setBills(sampleBills);
        setIsDemo(true);
        setError('Live bills could not be loaded. You can explore the sample deck or try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [revision]);

  return { bills, data: bills, loading, isLoading: loading, error, isDemo, refetch };
}
