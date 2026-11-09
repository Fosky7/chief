import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAdminQueue } from '@/hooks/useAdminQueue';

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [{ title: 'Admin review · Krossbuild' }],
  }),
  component: AdminReviewPage,
});

function AdminReviewPage() {
  const navigate = useNavigate();
  const {
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
  } = useAdminQueue();

  useEffect(() => {
    if (!authLoading && !authenticated) {
      void navigate({ to: '/sign-in' });
    }
  }, [authLoading, authenticated, navigate]);

  if (authLoading || loading) {
    return (
      <main className='mx-auto w-full max-w-5xl px-4 py-10'>
        <p className='text-sm text-muted-foreground'>Loading review queue…</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className='mx-auto w-full max-w-5xl px-4 py-10'>
        <p className='text-sm text-muted-foreground'>Redirecting to sign in…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className='mx-auto w-full max-w-5xl px-4 py-10'>
        <h1 className='text-2xl font-semibold'>Admins only</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          You need an administrator role to review bills.
        </p>
      </main>
    );
  }

  return (
    <main className='mx-auto w-full max-w-5xl px-4 py-10' data-testid='admin-queue'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Bills awaiting review</h1>
          <p className='mt-1 text-sm text-muted-foreground'>
            Approve genuine bills, reject duplicates, and settle funded bills.
          </p>
        </div>
        <span className='rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground'>
          {bills.length} pending
        </span>
      </div>

      {error ? (
        <p role='alert' className='mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
          {error}
        </p>
      ) : null}

      {actionMessage ? (
        <p role='status' className='mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700'>
          {actionMessage}
        </p>
      ) : null}

      {bills.length === 0 ? (
        <div className='mt-8 rounded-xl border border-dashed px-6 py-12 text-center'>
          <p className='text-sm font-medium'>No bills awaiting review</p>
          <p className='mt-1 text-sm text-muted-foreground'>New submissions will appear here.</p>
        </div>
      ) : (
        <ul className='mt-6 grid gap-4'>
          {bills.map((bill) => {
            const funded =
              Number(bill.funded_amount ?? 0) > 0 ||
              ['funded', 'approved'].includes(String(bill.status ?? '').toLowerCase());
            return (
              <li key={bill.id} data-testid='admin-bill-card' className='rounded-xl border bg-card p-5 shadow-sm'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <h2 className='text-lg font-semibold'>{bill.title || 'Untitled bill'}</h2>
                    {bill.description ? (
                      <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{bill.description}</p>
                    ) : null}
                  </div>
                  <span className='rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700'>
                    Pending review
                  </span>
                </div>

                <div className='mt-4 flex flex-wrap items-center gap-3 text-sm'>
                  <span className='font-medium'>₦{Number(bill.amount ?? 0).toLocaleString()}</span>
                  <span className='text-muted-foreground'>Funded: ₦{Number(bill.funded_amount ?? 0).toLocaleString()}</span>
                </div>

                <div className='mt-5 flex flex-wrap gap-2'>
                  <button
                    type='button'
                    onClick={() => void approve(bill.id)}
                    className='rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700'
                  >
                    Approve
                  </button>
                  <button
                    type='button'
                    onClick={() => void reject(bill.id)}
                    className='rounded-md border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10'
                  >
                    Reject
                  </button>
                  {funded ? (
                    <button
                      type='button'
                      onClick={() => void markPaid(bill.id)}
                      className='rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted'
                    >
                      Mark paid to biller
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
