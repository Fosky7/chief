import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

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

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString('en-NG')}`
}

function fundedPercent(funded: number, target: number) {
  if (target <= 0) return 0
  return Math.min(100, Math.round((funded / target) * 100))
}

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
    <main
      data-testid="discover-page"
      className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6"
    >
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
        <p className="text-sm text-muted-foreground">
          Swipe through bills that need your voice.
        </p>
      </header>

      <input
        data-testid="discover-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search bills"
        className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              category === item
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <section data-testid="discover-deck" className="flex flex-col gap-3">
        {filtered.map((bill) => (
          <article
            data-testid="discover-card"
            key={bill.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold">{bill.title}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {bill.category}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{bill.summary}</p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${fundedPercent(bill.funded, bill.target)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNaira(bill.funded)} of {formatNaira(bill.target)} ·{' '}
              {fundedPercent(bill.funded, bill.target)}% funded
            </p>
          </article>
        ))}
      </section>

      <p data-testid="discover-count" className="text-sm font-medium">
        Needed: {filtered.length}
      </p>
    </main>
  )
}
