import { createFileRoute, Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatNaira } from '@/lib/currency';
import { SwipeCard, type SwipeBill } from '@/components/SwipeCard';
import { liveSampleBills } from '@/lib/sampleBills';
import { useApprovedBills } from '@/hooks/useApprovedBills';

export const Route = createFileRoute('/discover')({
  head: () => ({
    meta: [{ title: 'Discover bills — Chief' }],
  }),
  component: DiscoverPage,
});

/** Quick-pick amounts offered in the give sheet (in naira). */
const AMOUNT_PRESETS = [1000, 2500, 5000, 10000, 25000, 50000];

/**
 * Column aliases seen across the bills table and the bundled sample fixtures.
 * Approved bills are normalised through these so the deck always finds the
 * Needed / Raised figures and the photo regardless of the row shape.
 */
const NEEDED_KEYS = [
  'needed',
  'neededAmount',
  'needed_amount',
  'amount_needed',
  'goal_amount',
  'target_amount',
  'amount',
];
const RAISED_KEYS = [
  'raised',
  'raisedAmount',
  'raised_amount',
  'amount_raised',
  'funded_amount',
  'total_raised',
];
const PHOTO_KEYS = ['photoUrl', 'photo_url', 'imageUrl', 'image_url', 'cover_image_url', 'photo'];
const TITLE_KEYS = ['title', 'name', 'bill_title'];
const CATEGORY_KEYS = ['category', 'category_name'];
const LOCATION_KEYS = ['location', 'city', 'state'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Parse a loose money value (number, numeric string, "₦250,000") to a number. */
function toAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickAmount(record: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const amount = toAmount(record[key]);
    if (amount !== null) return amount;
  }
  return null;
}

function pickText(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
  }
  return null;
}

/**
 * Convert an approved bill row (or a sample fixture) into the shape the swipe
 * card renders. Returns null for rows without a usable id so the deck never
 * renders a key-less card.
 */
function normalizeBill(raw: unknown): SwipeBill | null {
  if (!isRecord(raw)) return null;

  const rawId = raw.id;
  const id =
    typeof rawId === 'string' && rawId.trim() !== ''
      ? rawId.trim()
      : typeof rawId === 'number'
        ? String(rawId)
        : null;
  if (!id) return null;

  return {
    id,
    title: pickText(raw, TITLE_KEYS) ?? 'Untitled bill',
    photoUrl: pickText(raw, PHOTO_KEYS),
    category: pickText(raw, CATEGORY_KEYS),
    location: pickText(raw, LOCATION_KEYS),
    needed: pickAmount(raw, NEEDED_KEYS) ?? 0,
    raised: pickAmount(raw, RAISED_KEYS) ?? 0,
  };
}

/** Map an unknown collection into a deck of renderable bills. */
function normalizeDeck(source: unknown): SwipeBill[] {
  if (!Array.isArray(source)) return [];
  return source
    .map(normalizeBill)
    .filter((bill): bill is SwipeBill => bill !== null);
}

/**
 * Swipe deck of approved bills. The top card exposes the bill photo, title,
 * Needed / Raised naira amounts and a funding progress bar, and links out
 * to the bill detail page via View details.
 *
 * Interactions wired here: the Skip button, the Give button (opens the amount
 * sheet) and a left drag on the top card (handled inside SwipeCard).
 */
function DiscoverPage() {
  const { bills: approvedBills } = useApprovedBills();

  const bills = useMemo<SwipeBill[]>(() => {
    // Prefer real approved bills; fall back to the verified sample deck so
    // discovery never renders an empty page while moderation is still filling.
    const approved = normalizeDeck(approvedBills);
    if (approved.length > 0) return approved;
    return normalizeDeck(liveSampleBills);
  }, [approvedBills]);

  const total = bills.length;

  const [index, setIndex] = useState(0);
  const [giveBill, setGiveBill] = useState<SwipeBill | null>(null);

  // Whenever the source deck changes (e.g. approved bills arrive), restart at
  // the top so the counter and current/upcoming cards stay in sync.
  useEffect(() => {
    setIndex(0);
  }, [bills]);

  const current = index < total ? bills[index] : undefined;
  const upcoming = index + 1 < total ? bills[index + 1] : undefined;

  const handleSkip = useCallback(() => {
    setIndex((value) => (value < total ? value + 1 : value));
  }, [total]);

  const handleGive = useCallback((bill: SwipeBill) => {
    setGiveBill(bill);
  }, []);

  const handleRestart = useCallback(() => setIndex(0), []);
  const handleCloseGive = useCallback(() => setGiveBill(null), []);

  return (
    <main className='mx-auto max-w-3xl px-4 py-14 sm:py-20'>
      <section className='animate-fade-up'>
        <p className='text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]'>
          Verified · Real people
        </p>
        <h1 className='mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl'>
          Discover bills
        </h1>
        <p className='mt-3 max-w-xl text-muted-foreground'>
          Swipe left to skip, or give what you can. Every bill is verified before it reaches the deck.
        </p>
      </section>

      <section className='mt-10' aria-label='Bill deck'>
        {current ? (
          <>
            <div className='relative'>
              {upcoming ? (
                <SwipeCard
                  key={upcoming.id}
                  bill={upcoming}
                  onSkip={handleSkip}
                  onGive={handleGive}
                  className='absolute inset-x-3 top-3 scale-[0.97] opacity-60'
                />
              ) : null}
              <SwipeCard
                key={current.id}
                bill={current}
                isTop
                onSkip={handleSkip}
                onGive={handleGive}
              />
            </div>

            <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
              <button
                type='button'
                data-testid='deck-skip'
                onClick={handleSkip}
                className='glass inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-foreground shadow-elegant transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                <span aria-hidden='true'>✕</span> Skip
              </button>
              <button
                type='button'
                data-testid='deck-give'
                onClick={() => handleGive(current)}
                className='bg-brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              >
                Give
              </button>
            </div>

            <p data-testid='deck-position' className='mt-4 text-center text-sm text-muted-foreground'>
              Bill {index + 1} of {total}
            </p>
          </>
        ) : (
          <div
            data-testid='deck-empty'
            className='glass shadow-elegant animate-fade-up rounded-2xl p-8 text-center'
          >
            <p className='font-display text-2xl font-semibold'>You're all caught up</p>
            <p className='mt-2 text-muted-foreground'>
              You've seen every verified bill for now. Check back soon.
            </p>
            <button
              type='button'
              data-testid='deck-restart'
              onClick={handleRestart}
              className='glass mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              Start over
            </button>
          </div>
        )}
      </section>

      <Link
        to='/'
        className='glass mt-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10'
      >
        <span aria-hidden='true'>←</span> Back home
      </Link>

      {giveBill ? <GiveSheet bill={giveBill} onClose={handleCloseGive} /> : null}
    </main>
  );
}

type GiveSheetProps = {
  bill: SwipeBill;
  onClose: () => void;
};

/** Bottom sheet that lets someone pick an amount to give to the current bill. */
function GiveSheet({ bill, onClose }: GiveSheetProps) {
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center sm:items-center'>
      <button
        type='button'
        aria-label='Dismiss amount chooser'
        onClick={onClose}
        className='absolute inset-0 bg-background/80 backdrop-blur-sm'
      />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='give-sheet-title'
        data-testid='give-sheet'
        className='glass shadow-elegant animate-fade-up relative z-10 w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl'
      >
        <h2 id='give-sheet-title' className='font-display text-2xl font-semibold'>
          Choose an amount
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>Supporting {bill.title}</p>

        <div className='mt-5 grid grid-cols-3 gap-2'>
          {AMOUNT_PRESETS.map((value) => (
            <button
              key={value}
              type='button'
              data-testid={`give-amount-${value}`}
              onClick={() => setAmount(value)}
              aria-pressed={amount === value}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                amount === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:bg-muted'
              }`}
            >
              {formatNaira(value)}
            </button>
          ))}
        </div>

        <div className='mt-6 flex items-center justify-end gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            Close
          </button>
          <Link
            to='/bills/$id'
            params={{ id: bill.id }}
            onClick={onClose}
            className='bg-brand-gradient inline-flex items-center rounded-full px-5 py-2 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  );
}
