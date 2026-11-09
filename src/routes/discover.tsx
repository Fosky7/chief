import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { GlowBackdrop, GradientButton, SectionHeading } from '@/components/ui/brand'
import { SwipeCard, type SwipeCardBill } from '@/components/SwipeCard'
import { AmountSheet } from '@/components/ui/amount-sheet'
import { useApprovedBills } from '@/hooks/useApprovedBills'

export const Route = createFileRoute('/discover')({
  head: () => ({ meta: [{ title: 'Discover bills — Chief' }] }),
  component: DiscoverPage,
})

function DiscoverPage() {
  const { bills, loading, error } = useApprovedBills()
  const [cursor, setCursor] = useState(0)
  const [amountFor, setAmountFor] = useState<SwipeCardBill | null>(null)
  const [lastChosen, setLastChosen] = useState<string | null>(null)

  const current = bills[cursor]
  const remaining = Math.max(0, bills.length - cursor)

  const skip = () => setCursor((value) => Math.min(value + 1, bills.length))

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
              Needed: {remaining}
            </p>
          }
        />
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Swipe left to skip a bill, or tap the heart to give. Every bill here has
          been reviewed before it reached your deck.
        </p>

        <section data-testid="discover-deck" className="mt-10 flex justify-center">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading bills…</p>
          ) : current ? (
            <SwipeCard
              key={current.id}
              bill={current as SwipeCardBill}
              onSkip={skip}
              onSupport={() => setAmountFor(current as SwipeCardBill)}
            />
          ) : (
            <div
              data-testid="discover-empty"
              className="glass shadow-elegant w-full max-w-md rounded-3xl p-8 text-center"
            >
              <h2 className="text-xl font-semibold text-foreground">You’re all caught up</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You have seen every bill in the deck. Come back soon, new bills are
                verified every day.
              </p>
              <GradientButton to="/" variant="ghost" size="md" className="mt-5">
                Back to home
              </GradientButton>
            </div>
          )}
        </section>

        {error && (
          <p role="status" className="mt-6 text-center text-xs text-muted-foreground">
            {error}
          </p>
        )}

        {lastChosen && (
          <p data-testid="discover-chosen" className="mt-6 text-center text-sm text-foreground">
            You chose {lastChosen}.{' '}
            <Link to="/auth" className="text-primary hover:underline">
              Sign in to complete your gift
            </Link>
            .
          </p>
        )}
      </section>

      <AmountSheet
        open={amountFor !== null}
        billTitle={amountFor?.title}
        onClose={() => setAmountFor(null)}
        onSelect={(amount) =>
          setLastChosen(
            new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(amount),
          )
        }
      />
    </div>
  )
}
