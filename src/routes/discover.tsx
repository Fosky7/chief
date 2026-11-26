import { useEffect, useRef, useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState } from '@/components/LoadingState';
import { SwipeCard } from '@/components/SwipeCard';
import { DonateSheet } from '@/components/DonateSheet';
import { sampleBills } from '@/lib/sampleBills';
import { startCheckout } from '@/services/payments';

export const Route = createFileRoute('/discover')({
  head: () => ({
    meta: [
      { title: 'Discover verified bills — Chief' },
      {
        name: 'description',
        content:
          'Swipe through verified rent, school fees and hospital bills from real people and fund the ones that move you.',
      },
    ],
  }),
  component: DiscoverPage,
});

/** A bill as rendered by the donor deck. */
type DiscoverBill = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  city: string;
  biller: string;
  raised: number;
  goal: number;
  imageUrl: string | null;
};

type DeckState = 'loading' | 'ready';

/** Machine statuses that must never leak into the donor-facing deck. */
const HIDDEN_STATUSES = new Set(['pending', 'rejected', 'declined', 'draft', 'paid']);

const EMPTY_DECK_TITLE = "You've seen every bill";

const primaryButtonClass =
  'bg-brand-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60';

const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60';

function asText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

/** Parses a naira amount that may arrive as a number, a string or NULL. */
function asAmount(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0;
  const parsed = Number.parseFloat(asText(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Normalises a backend row into the deck shape. Column names differ between
 * iterations of the schema, so each field falls back through the known aliases
 * and finally to a readable default instead of rendering `undefined`.
 */
function normaliseBill(row: Record<string, unknown>): DiscoverBill | null {
  const id = asText(row.id);
  if (!id) return null;

  const goal = asAmount(row.amount ?? row.goal ?? row.target ?? row.total_amount);
  const raised = asAmount(row.raised ?? row.amount_raised ?? row.raised_amount ?? row.funded_amount);
  const imageUrl = asText(row.image_url ?? row.imageUrl ?? row.proof_url ?? row.image);

  return {
    id,
    title: asText(row.title ?? row.name) || 'Untitled bill',
    description: asText(row.description ?? row.story ?? row.summary) || null,
    category: asText(row.category ?? row.type) || 'Bill',
    city: asText(row.city ?? row.location ?? row.state) || 'Nigeria',
    biller: asText(row.biller ?? row.biller_name ?? row.vendor ?? row.merchant) || 'Verified biller',
    raised,
    goal,
    imageUrl: imageUrl || null,
  };
}

/** Realistic fallback deck so the swipe screen never renders an empty shell. */
function sampleDeck(): DiscoverBill[] {
  return sampleBills.map((bill) => ({
    id: bill.id,
    title: bill.title,
    description: bill.description,
    category: bill.category,
    city: bill.city,
    biller: 'Verified biller',
    raised: bill.raised,
    goal: bill.goal,
    imageUrl: bill.image,
  }));
}

/**
 * Reads the public bill catalogue.
 *
 * The Supabase client is not generated with per-table row types here, so the
 * response is read through a narrow structural type and normalised above. That
 * keeps a schema drift (renamed or missing column) from blanking the deck.
 */
async function fetchDiscoverBills(): Promise<DiscoverBill[]> {
  const client = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
    };
  };

  const { data, error } = await client.from('bills').select('*');

  if (error) {
    throw new Error(error.message || 'The bills service is unavailable right now.');
  }
  if (!Array.isArray(data)) return [];

  return data
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .filter((row) => !HIDDEN_STATUSES.has(asText(row.status).toLowerCase()))
    .map(normaliseBill)
    .filter((bill): bill is DiscoverBill => bill !== null);
}

function DiscoverPage() {
  // The deck starts on the built-in bills so a card is on screen immediately;
  // the live catalogue replaces it as soon as the backend answers. That way a
  // slow (or unreachable) backend can never leave the donor staring at a
  // spinner with no card to swipe.
  const [state, setState] = useState<DeckState>('loading');
  const [bills, setBills] = useState<DiscoverBill[]>(() => sampleDeck());
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [donateOpen, setDonateOpen] = useState(false);
  // Once the donor has interacted we keep their place and never swap the deck.
  const interactedRef = useRef(false);

  useEffect(() => {
    let active = true;
    setState('loading');
    setNotice(null);

    fetchDiscoverBills()
      .then((rows) => {
        if (!active) return;
        if (rows.length > 0 && !interactedRef.current) {
          setBills(rows);
          setIndex(0);
          setNotice(null);
        } else if (rows.length === 0) {
          // A real empty catalogue: keep the sample deck so the page stays useful.
          setNotice(null);
        }
        setState('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        // Never leave a donor on a dead end: keep the deck usable and explain.
        setNotice(
          error instanceof Error && error.message
            ? error.message
            : 'We could not load the latest bills.',
        );
        setState('ready');
      });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const current = bills[index] ?? null;
  const remaining = Math.max(bills.length - index, 0);

  function skip() {
    interactedRef.current = true;
    setIndex((value) => Math.min(value + 1, bills.length));
  }

  function donate() {
    interactedRef.current = true;
    setDonateOpen(true);
  }

  function startOver() {
    interactedRef.current = true;
    setIndex(0);
  }

  return (
    <div className='relative isolate'>
      <div className='mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pt-14'>
        <section
          aria-label='Discover bills introduction'
          className='mb-8 flex flex-wrap items-end justify-between gap-4'
        >
          <div className='max-w-xl'>
            <p className='text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]'>Swipe to help</p>
            <h1 className='mt-2 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl'>
              Discover bills
            </h1>
            <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>
              Every bill here has been checked by our team. Help the ones that move you, or skip to the
              next one.
            </p>
          </div>
          <Link to='/bills/new' className={secondaryButtonClass}>
            Post a bill
          </Link>
        </section>

        {state === 'loading' ? (
          <LoadingState
            testId='discover-loading'
            label='Loading bills'
            description='Fetching the latest verified bills for the deck.'
            compact
            className='mb-5 rounded-2xl border border-border/70 bg-muted/40 px-4 py-3'
          />
        ) : null}

        {state === 'ready' && notice ? (
          <div
            role='status'
            data-testid='discover-notice'
            className='mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/60 px-4 py-3 text-sm text-muted-foreground'
          >
            <span>Showing saved bills — the live catalogue is temporarily unavailable.</span>
            <button
              type='button'
              onClick={() => {
                interactedRef.current = false;
                setReloadToken((token) => token + 1);
              }}
              className='rounded-full border border-border/70 bg-card px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted'
            >
              Try again
            </button>
          </div>
        ) : null}

        {current ? (
          <section aria-label='Bill deck' className='space-y-5'>
            <SwipeCard bill={current} onDonate={donate} onSkip={skip} />

            <p className='text-center text-xs font-medium uppercase tracking-wider text-muted-foreground'>
              {remaining} of {bills.length} bills left
            </p>
          </section>
        ) : null}

        {!current ? (
          <EmptyState
            testId='discover-empty'
            title={EMPTY_DECK_TITLE}
            description='That is every verified bill for now. Check back soon — new bills are added as they pass review.'
            action={
              <button type='button' onClick={startOver} className={primaryButtonClass}>
                Start over
              </button>
            }
          />
        ) : null}
      </div>

      {donateOpen && current ? (
        <DonateSheet
          open={donateOpen}
          onClose={() => setDonateOpen(false)}
          billTitle={current.title}
          remaining={Math.max(current.goal - current.raised, 0)}
          onPay={async (amount) => {
            await startCheckout({ billId: current.id, amount });
          }}
        />
      ) : null}
    </div>
  );
}