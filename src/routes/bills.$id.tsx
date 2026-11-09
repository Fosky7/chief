import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeBill, type AdminQueueBill } from '@/services/admin';
import { formatNaira } from '@/lib/currency';

export const Route = createFileRoute('/bills/$id')({
  head: () => ({ meta: [{ title: 'Bill details | Kross' }] }),
  component: BillDetailPage,
});

function BillDetailPage() {
  const { id } = Route.useParams();
  const [bill, setBill] = useState<AdminQueueBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    supabase.from('bills').select('*').eq('id', id).maybeSingle().then(({ data, error: queryError }) => {
      if (!alive) return;
      if (queryError) {
        setError(queryError.message);
      } else {
        setBill(data ? normalizeBill(data) : null);
      }
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Bill details</h1>
        <Link to="/discover" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Back to discover
        </Link>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading bill...</p> : null}
      {error ? <p className="rounded-md border border-destructive/40 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      {!loading && !error && !bill ? <p className="rounded-md border px-4 py-6 text-sm">Bill not found</p> : null}

      {bill ? (
        <article className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">{bill.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{bill.status}</p>
          {bill.description ? <p className="mt-4 text-sm text-muted-foreground">{bill.description}</p> : null}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Amount</dt>
              <dd className="mt-1 text-lg font-semibold">{formatNaira(bill.amount)}</dd>
            </div>
            <div className="rounded-lg border p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Raised</dt>
              <dd className="mt-1 text-lg font-semibold">{formatNaira(bill.fundedAmount)}</dd>
            </div>
          </dl>
        </article>
      ) : null}
    </main>
  );
}
