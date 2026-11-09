import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useAdminQueue } from '@/hooks/useAdminQueue';
import { formatNaira, fundedPercent } from '@/lib/currency';

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: 'Admin review | Kross' }] }),
  component: AdminPage,
});

function statusLabel(status: string): string {
  const value = status.toLowerCase();
  if (value.includes('pending')) return 'Pending review';
  if (value === 'approved') return 'Approved';
  if (value === 'rejected') return 'Rejected';
  if (value === 'paid') return 'Paid out';
  if (value === 'funded') return 'Funded';
  return status;
}

function AdminPage() {
  const { bills, loading, error, isAdmin, approve, reject, markPaid } = useAdminQueue();
  const [message, setMessage] = useState<string | null>(null);

  async function handleApprove(id: string) {
    try {
      await approve(id);
      setMessage('Bill approved');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not approve bill');
    }
  }

  async function handleReject(id: string) {
    try {
      await reject(id);
      setMessage('Bill rejected');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not reject bill');
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await markPaid(id);
      setMessage('Paid out');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not mark bill paid');
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Admin</p>
          <h1 className="text-3xl font-bold">Bills awaiting review</h1>
        </div>
        <Link to="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Back home
        </Link>
      </div>

      {message ? <p className="mb-4 rounded-md border bg-muted px-4 py-3 text-sm">{message}</p> : null}
      {error ? <p className="mb-4 rounded-md border border-destructive/40 px-4 py-3 text-sm text-destructive">{error}</p> : null}
      {loading || isAdmin === null ? <p className="text-sm text-muted-foreground">Loading review queue...</p> : null}
      {isAdmin === false ? <p className="rounded-md border px-4 py-6 text-sm">Admins only</p> : null}

      {isAdmin && !loading ? (
        bills.length === 0 ? (
          <p className="rounded-md border px-4 py-6 text-sm">No bills awaiting review</p>
        ) : (
          <div className="grid gap-4">
            {bills.map((bill) => {
              const label = statusLabel(bill.status);
              const lowered = label.toLowerCase();
              const percent = bill.amount > 0 ? fundedPercent(bill.fundedAmount, bill.amount) : 0;
              const canDecide = !['approved', 'rejected', 'paid', 'paid out'].includes(lowered);
              const canPay = bill.fundedAmount > 0 || bill.status.toLowerCase().includes('funded') || bill.status.toLowerCase() === 'approved';

              return (
                <article key={bill.id} className="rounded-xl border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{bill.title}</h2>
                      <p className="text-sm text-muted-foreground">{label}</p>
                    </div>
                    <p className="text-lg font-semibold">{formatNaira(bill.amount)}</p>
                  </div>

                  {bill.description ? <p className="mt-3 text-sm text-muted-foreground">{bill.description}</p> : null}
                  <p className="mt-3 text-sm">Funded: {formatNaira(bill.fundedAmount)} ({percent}%)</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canDecide ? (
                      <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" onClick={() => void handleApprove(bill.id)}>
                        Approve
                      </button>
                    ) : null}
                    {canDecide ? (
                      <button type="button" className="rounded-md border px-4 py-2 text-sm font-medium" onClick={() => void handleReject(bill.id)}>
                        Reject
                      </button>
                    ) : null}
                    {canPay ? (
                      <button type="button" className="rounded-md border px-4 py-2 text-sm font-medium" onClick={() => void handleMarkPaid(bill.id)}>
                        Mark paid to biller
                      </button>
                    ) : null}
                    <Link to="/bills/$id" params={{ id: bill.id }} className="rounded-md border px-4 py-2 text-sm font-medium">
                      View bill
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : null}
    </main>
  );
}
