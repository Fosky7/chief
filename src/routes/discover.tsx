import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  CategoryBadge,
  GlowBackdrop,
  ProgressBar,
  SectionHeading,
} from '@/components/ui/brand'
import { formatNaira, fundedPercent } from '@/lib/currency'

type DiscoverBill = {
  id: string
  title: string
  category: string
  summary: string
  funded: number
  target: number
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
    </div>
  )
}
