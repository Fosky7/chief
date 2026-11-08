import { useEffect, useRef, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { SwipeCard } from '@/components/SwipeCard';
import { useApprovedBills } from '@/hooks/useApprovedBills';
import { formatNaira } from '@/lib/currency';
import type { BillDetail } from '@/lib/sampleBills';

export const Route = createFileRoute('/discover')({
  head: () => ({ meta: [
    { title: 'Discover bills — Chief' },
    { name: 'description', content: 'Discover approved bills and choose a cause to support.' },
  ] }),
  component: DiscoverPage,
});

function AmountDialog({ bill, isDemo, onClose }: { bill: BillDetail; isDemo: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState('5000');
  const numericAmount = Number(amount);
  const valid = Number.isFinite(numericAmount) && numericAmount >= 100 && Number.isInteger(numericAmount);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { if (element?.open) element.close(); };
  }, []);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="amount-heading"
      aria-describedby="amount-bill"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-elegant backdrop:bg-foreground/60"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="amount-heading" className="text-2xl font-semibold">Choose an amount</h2>
        <button type="button" autoFocus onClick={onClose} aria-label="Close amount chooser" className="rounded-full px-3 py-1 text-xl hover:bg-muted">×</button>
      </div>
      <p id="amount-bill" className="mt-2 text-muted-foreground">{bill.title}</p>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {[1000, 5000, 10000].map((value) => (
          <button key={value} type="button" aria-pressed={numericAmount === value} onClick={() => setAmount(String(value))} className={`rounded-xl border px-2 py-3 text-sm font-semibold ${numericAmount === value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
            {formatNaira(value)}
          </button>
        ))}
      </div>
      <label htmlFor="gift-amount" className="mt-5 block text-sm font-medium">Custom amount (₦)</label>
      <input id="gift-amount" type="number" min="100" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} aria-invalid={!valid} aria-describedby="amount-help" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground" />
      <p id="amount-help" className="mt-2 text-xs text-muted-foreground">Enter a whole-naira amount of at least ₦100. No payment is taken here.</p>
      {isDemo ? (
        <p role="status" className="mt-5 rounded-xl bg-muted p-4 text-sm text-muted-foreground">This is a sample bill. Payments are unavailable for demo content.</p>
      ) : valid ? (
        <Link to="/bills/$id" params={{ id: bill.id }} className="bg-brand-gradient mt-5 block rounded-full px-5 py-3 text-center font-semibold text-primary-foreground">View bill before giving {formatNaira(numericAmount)}</Link>
      ) : (
        <p role="status" className="mt-4 text-sm text-destructive">Please enter a valid amount.</p>
      )}
      <button type="button" onClick={onClose} className="mt-4 w-full rounded-full border border-border px-4 py-3 font-medium hover:bg-muted">Back to discovery</button>
    </dialog>
  );
}

function DiscoverPage() {
  const { bills, loading, error, isDemo, refetch } = useApprovedBills();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [selected, setSelected] = useState<BillDetail | null>(null);
  const current = bills.find((bill) => !dismissed.includes(bill.id));
  const position = bills.filter((bill) => dismissed.includes(bill.id)).length;

  return (
    <main className="min-h-dvh overflow-x-clip bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Discover</h1>
          <Link to="/" className="rounded-full px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">Home</Link>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Swipe right to give, left to skip. Or use the buttons below.</p>
        {isDemo && !loading && (
          <div className="mt-4 rounded-xl border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>{error || 'No live approved bills are available. Explore these sample bills instead.'}</p>
            <button type="button" onClick={refetch} className="mt-2 font-semibold text-primary underline underline-offset-4">Retry live bills</button>
          </div>
        )}
        <div className="mt-6" aria-busy={loading}>
          {loading ? (
            <p role="status" className="rounded-3xl bg-muted p-10 text-center text-muted-foreground">Loading bills…</p>
          ) : current ? (
            <>
              <p data-testid="deck-counter" className="mb-4 text-xs text-muted-foreground" aria-live="polite">{position + 1} / {bills.length}</p>
              <SwipeCard key={current.id} bill={current} onSkip={() => setDismissed((ids) => [...ids, current.id])} onSupport={() => setSelected(current)} />
            </>
          ) : (
            <section data-testid="deck-end" className="rounded-3xl border border-border bg-card p-8 text-center">
              <h2 className="text-2xl font-semibold">You're all caught up</h2>
              <p className="mt-3 text-muted-foreground">You've seen every bill in this deck. Thank you for taking a look.</p>
              <button type="button" data-testid="deck-restart" onClick={() => setDismissed([])} className="bg-brand-gradient mt-6 rounded-full px-6 py-3 font-semibold text-primary-foreground">Start over</button>
            </section>
          )}
        </div>
        {selected && <AmountDialog bill={selected} isDemo={isDemo} onClose={() => setSelected(null)} />}
      </div>
    </main>
  );
}
