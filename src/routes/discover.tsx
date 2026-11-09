import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useMemo, useState } from 'react'
import { Heart, Search, X } from 'lucide-react'
import {
  CategoryBadge,
  GlowBackdrop,
  ProgressBar,
  SectionHeading,
} from '@/components/ui/brand'
import { AmountSheet } from '@/components/ui/amount-sheet'
import { SwipeCard, type SwipeDirection } from '@/components/SwipeCard'
import { useApprovedBills } from '@/hooks/useApprovedBills'
import { formatNaira, fundedPercent } from '@/lib/currency'

/** Curated bill shape used by the searchable grid below the deck. */
type DiscoverBill = {
  id: string
  title: string
  category: string
  summary: string
  funded: number
  target: number
}

/** Minimal shape handed to the "Choose an amount" giving sheet. */
type GiveTarget = {
  id: string
  title: string
  /** Amount needed to fully fund the bill, in whole Naira. */
  goal: number
  /** Amount already raised, in whole Naira. */
  raised: number
}

const bills: DiscoverBill[] = [
  {
    id: 'health-1',
    title: 'Primary Healthcare Fund',
    category: 'Health',
    summary: 'Equip 120 rural clinics with essential medicines and trained staff.',
    funded: 4200000,
    target: 8000000,
  },
  {
    id: 'education-1',
    title: 'Safe Schools Initiative',
    category: 'Education',
    summary: 'Rebuild classrooms and provide learning materials for 3,000 pupils.',
    funded: 2600000,
    target: 6000000,
  },
  {
    id: 'infrastructure-1',
    title: 'Clean Water Access',
    category: 'Infrastructure',
    summary: 'Solar-powered boreholes for communities without safe water.',
    funded: 5100000,
    target: 7000000,
  },
]

const categories = ['All', 'Health', 'Education', 'Infrastructure'] as const

export const Route = createFileRoute('/discover')({
  head: () => ({ meta: [{ title: 'Discover — Chief' }] }),
  component: DiscoverPage,
})

function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof categories)[number]>('All')

  // Approved bills feed (falls back to curated samples when the backend is
  // empty or unreachable) powering the swipe deck at the top of the page.
  const { bills: approvedBills, loading: deckLoading } = useApprovedBills()
  const [deckIndex, setDeckIndex] = useState(0)

  // Bill whose "Choose an amount" giving sheet is currently open. It can be
  // opened from the top deck card or from any bill in the grid below.
  const [giveTarget, setGiveTarget] = useState<GiveTarget | null>(null)

  const deckLength = approvedBills.length
  // Wraps forever so the deck never runs dry.
  const deckPosition = deckLength > 0 ? deckIndex % deckLength : 0
  const topBill = deckLength > 0 ? approvedBills[deckPosition] : null

  const advanceDeck = useCallback(() => {
    setDeckIndex((current) =>
      deckLength > 0 ? (current + 1) % deckLength : current + 1,
    )
  }, [deckLength])

  const openGiving = useCallback((bill: GiveTarget) => {
    setGiveTarget(bill)
  }, [])

  const giveTopBill = useCallback(() => {
    if (!topBill) return
    openGiving({
      id: topBill.id,
      title: topBill.title,
      goal: topBill.goal,
      raised: topBill.raised,
    })
  }, [openGiving, topBill])

  /** Dragging left skips the bill; dragging right opens the giving sheet. */
  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!topBill) return
      if (direction === 'right') {
        giveTopBill()
        return
      }
      advanceDeck()
    },
    [advanceDeck, giveTopBill, topBill],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return bills.filter((bill) => {
      const matchesCategory = category === 'All' || bill.category === category
      const matchesQuery =
        !needle ||
        `${bill.title} ${bill.category} ${bill.summary}`.toLowerCase().includes(needle)
      return matchesCategory && matchesQuery
    })
  }, [query, category])

  return (
    <div data-testid="discover-page" className="relative isolate overflow-hidden">
      <GlowBackdrop />

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:pt-16">
        <SectionHeading
          as="h1"
          eyebrow="Needed"
          title="Discover bills"
          action={
            <p
              data-testid="discover-count"
              className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
            >
              Needed: {filtered.length}
            </p>
          }
        />
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Swipe through bills that need your voice.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              data-testid="discover-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search bills"
              aria-label="Search bills"
              className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  category === item
                    ? 'border-transparent bg-brand-gradient text-primary-foreground shadow-elegant'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <section
          aria-label="Swipe deck"
          data-testid="discover-swipe-deck"
          className="mt-8"
        >
          {topBill ? (
            <div className="mx-auto w-full max-w-sm">
              {/* Keyed by position so wrapping back to a bill still remounts
                  the card and resets any in-flight drag transform. */}
              <SwipeCard
                key={`${topBill.id}-${deckPosition}`}
                bill={topBill}
                onSwipe={handleSwipe}
                className="w-full"
              />

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  data-testid="deck-skip"
                  onClick={advanceDeck}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                  Skip
                </button>
                <button
                  type="button"
                  data-testid="deck-give"
                  onClick={giveTopBill}
                  className="bg-brand-gradient shadow-elegant inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                >
                  <Heart aria-hidden="true" className="h-4 w-4" />
                  Give
                </button>
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Swipe left to skip · swipe right to give
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {deckLoading ? 'Loading bills…' : 'No bills to swipe yet.'}
            </p>
          )}
        </section>

        <section
          data-testid="discover-deck"
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((bill) => (
            <article
              data-testid="discover-card"
              key={bill.id}
              className="glass shadow-elegant flex flex-col rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">{bill.title}</h2>
                <CategoryBadge category={bill.category} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {bill.summary}
              </p>
              <div className="mt-auto pt-5">
                <ProgressBar value={bill.funded} goal={bill.target} />
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatNaira(bill.funded)} of {formatNaira(bill.target)} ·{' '}
                  {fundedPercent(bill.funded, bill.target)}% funded
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openGiving({
                      id: bill.id,
                      title: bill.title,
                      goal: bill.target,
                      raised: bill.funded,
                    })
                  }
                  className="bg-brand-gradient shadow-elegant mt-4 w-full rounded-full px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                >
                  Give
                </button>
              </div>
            </article>
          ))}
        </section>

        {filtered.length === 0 && (
          <p className="mt-8 text-sm text-muted-foreground">
            No bills match your search yet.
          </p>
        )}
      </section>

      {/* Remounting per bill guarantees the sheet resets its amount state. */}
      <AmountSheet
        key={giveTarget?.id ?? 'closed'}
        open={giveTarget !== null}
        bill={giveTarget}
        onClose={() => setGiveTarget(null)}
      />
    </div>
  )
}