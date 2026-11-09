import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import {
  GlowBackdrop,
  GradientButton,
  SectionHeading,
  StatCard,
} from '@/components/ui/brand'
import { ProgressBar } from '@/components/ProgressBar'
import { useApprovedBills } from '@/hooks/useApprovedBills'
import { formatNaira, fundedPercent } from '@/lib/currency'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Chief — Home' }] }),
  component: HomePage,
})

const steps = [
  {
    title: 'Discover verified bills',
    body: 'Every rent, school, utility and hospital bill is reviewed by our team before it appears in the deck.',
  },
  {
    title: 'Help with a swipe',
    body: 'Swipe right to support a bill that moves you, or left to keep looking. No pressure, no noise.',
  },
  {
    title: 'Track the progress',
    body: 'Follow each bill from first donation to fully funded, with live progress you can trust.',
  },
]

/** How many live bills are teased on the home page before the deck itself. */
const FEATURED_LIMIT = 3

function HomePage() {
  // Same feed the swipe deck uses, so the home page teaser and `/discover`
  // never disagree (and both fall back to the curated samples when the
  // backend feed is empty).
  const { bills } = useApprovedBills()
  const featured = bills.slice(0, FEATURED_LIMIT)

  return (
    <div data-testid="home-page" className="relative isolate overflow-hidden">
      <GlowBackdrop />

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 pt-12 sm:pt-20">
        <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">
          Chief
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          Pay a bill with a swipe
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Discover real bills from real people across Nigeria, back the ones that
          matter to you, and follow every naira of progress in one place.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <GradientButton to="/discover" size="lg">
            Start swiping
          </GradientButton>
          <GradientButton to="/auth" variant="ghost" size="lg">
            Post a bill
          </GradientButton>
        </div>
      </section>

      <section
        aria-label="Sample stats"
        className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-3"
      >
        <StatCard value="₦1,000,000" label="Raised for verified bills" />
        <StatCard value="2,400+" label="Bills verified this year" />
        <StatCard value="36" label="States reached so far" />
      </section>

      {featured.length > 0 && (
        <section
          data-testid="featured-bills"
          aria-label="Featured bills"
          className="mx-auto w-full max-w-6xl px-4 pb-16"
        >
          <SectionHeading
            eyebrow="Featured"
            title="Bills waiting for a swipe"
            action={
              <Link
                to="/discover"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 transition hover:underline"
              >
                See all bills
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            }
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((bill) => (
              <Link
                key={bill.id}
                // String/never casts keep this compiling regardless of how
                // generated route types are named.
                to={'/bills/$id' as string}
                params={{ id: bill.id } as never}
                data-testid="featured-bill-card"
                data-bill-id={bill.id}
                aria-label={`${bill.title} — ${formatNaira(bill.goal)} needed`}
                className="glass shadow-elegant group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  {bill.imageUrl ? (
                    <img
                      src={bill.imageUrl}
                      alt={bill.title}
                      loading="lazy"
                      draggable={false}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={bill.title}
                      className="bg-brand-gradient h-full w-full"
                    />
                  )}

                  {bill.category && (
                    <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
                      {bill.category}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3
                    data-testid="featured-bill-title"
                    className="text-base font-semibold leading-snug text-foreground"
                  >
                    {bill.title}
                  </h3>
                  {bill.city && (
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {bill.city}
                    </p>
                  )}

                  <div className="mt-auto pt-4">
                    <ProgressBar
                      value={bill.raised}
                      goal={bill.goal}
                      size="sm"
                      label={`${bill.title} funding progress`}
                    />
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span data-testid="featured-bill-needed">
                        {formatNaira(bill.goal)} needed
                      </span>
                      <span className="font-semibold">
                        {fundedPercent(bill.raised, bill.goal)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <SectionHeading eyebrow="How it works" title="Help without the guesswork" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.title}
              className="glass shadow-elegant rounded-2xl p-6"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Check className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <div className="bg-brand-gradient shadow-elegant flex flex-col items-start gap-4 rounded-3xl p-8 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Need help with a bill?
            </h2>
            <p className="mt-2 max-w-lg text-sm text-white/85">
              Create an account and submit your bill for verification. Once it is
              approved, donors can start supporting it.
            </p>
          </div>
          <GradientButton to="/auth" variant="ghost" size="lg">
            Post a bill
          </GradientButton>
        </div>
      </section>
    </div>
  )
}
