import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Normalized approved bill used by the discovery deck.
 *
 * Database columns are mapped defensively (snake_case and camelCase are both
 * accepted) so the deck keeps working while the bills schema evolves.
 */
export type ApprovedBill = {
  id: string;
  title: string;
  story: string | null;
  category: string | null;
  city: string | null;
  biller: string | null;
  imageUrl: string | null;
  /** Target amount in naira. */
  needed: number;
  /** Amount raised so far in naira. */
  raised: number;
  donorCount: number | null;
  dueDate: string | null;
  status: string;
};

/** Columns that may hold the target amount, in priority order. */
const GOAL_KEYS = [
  'needed',
  'goal',
  'goal_amount',
  'goalAmount',
  'needed_amount',
  'neededAmount',
  'amount_needed',
  'target_amount',
];

/** Columns that may hold the raised amount, in priority order. */
const RAISED_KEYS = [
  'raised',
  'raised_amount',
  'raisedAmount',
  'amount_raised',
  'funded_amount',
  'funded',
];

const IMAGE_KEYS = ['image_url', 'imageUrl', 'photo_url', 'photoUrl', 'image', 'photo'];
const CITY_KEYS = ['city', 'location'];
const TITLE_KEYS = ['title', 'name'];
const CREATED_KEYS = ['created_at', 'createdAt'];

/** Statuses that mean "visible in discovery". */
const DISCOVERABLE_STATUSES = new Set(['approved', 'live', 'active']);

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function firstNumber(row: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const parsed = toNumber(row[key]);
    if (parsed !== null) return Math.max(parsed, 0);
  }
  return 0;
}

function firstString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return null;
}

/**
 * A bill belongs in the deck when its status is approved/live, or when the
 * record carries no status at all (early data / partially migrated rows).
 */
function isDiscoverable(row: Record<string, unknown>): boolean {
  const rawStatus = row.status;
  if (typeof rawStatus !== 'string' || rawStatus.trim() === '') return true;
  return DISCOVERABLE_STATUSES.has(rawStatus.trim().toLowerCase());
}

function sortedKey(row: Record<string, unknown>): number {
  const created = firstString(row, CREATED_KEYS);
  if (!created) return 0;
  const time = new Date(created).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/** Maps a raw `bills` row onto the normalized deck shape. */
function toApprovedBill(row: Record<string, unknown>): ApprovedBill | null {
  const rawId = row.id;
  const id = typeof rawId === 'string' ? rawId : typeof rawId === 'number' ? String(rawId) : null;
  const title = firstString(row, TITLE_KEYS);
  if (!id || !title) return null;

  return {
    id,
    title,
    story: firstString(row, ['story']),
    category: firstString(row, ['category']),
    city: firstString(row, CITY_KEYS),
    biller: firstString(row, ['biller']),
    imageUrl: firstString(row, IMAGE_KEYS),
    needed: firstNumber(row, GOAL_KEYS),
    raised: firstNumber(row, RAISED_KEYS),
    donorCount: toNumber(row.donor_count ?? row.donorCount),
    dueDate: firstString(row, ['due_date', 'dueDate']),
    status: typeof row.status === 'string' && row.status.trim() ? row.status : 'approved',
  };
}

/** Loads every discoverable bill, newest first. Throws on backend failure. */
async function fetchApprovedBills(): Promise<ApprovedBill[]> {
  const { data, error } = await supabase.from('bills').select('*');
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
  return rows
    .filter(isDiscoverable)
    .sort((a, b) => sortedKey(b) - sortedKey(a))
    .map(toApprovedBill)
    .filter((bill): bill is ApprovedBill => bill !== null);
}

/**
 * Approved bills for the swipe deck.
 *
 * Returns an empty list (never throws into render) when the backend is
 * unreachable, so `/discover` can fall back to the verified sample deck.
 */
export function useApprovedBills() {
  const [bills, setBills] = useState<ApprovedBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const approved = await fetchApprovedBills();
      if (!mountedRef.current) return;
      setBills(approved);
      setError(null);
    } catch (loadError) {
      if (!mountedRef.current) return;
      setBills([]);
      setError(loadError instanceof Error ? loadError.message : 'Could not load bills');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  return { bills, loading, error, refresh: load };
}

export default useApprovedBills;
