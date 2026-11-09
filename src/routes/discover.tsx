import { useCallback, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { CategoryBadge } from "@/components/ui/brand";
import { ProgressBar } from "@/components/ProgressBar";
import { SwipeCard, type SwipeDirection } from "@/components/SwipeCard";
import { AmountSheet } from "@/components/AmountSheet";
import { useApprovedBills, type ApprovedBill } from "@/hooks/useApprovedBills";
import { liveSampleBills } from "@/lib/sampleBills";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [{ title: "Discover bills — Chief" }],
  }),
  component: DiscoverPage,
});

// Left accent bar colour per category, using design tokens only.
const accentClass: Record<string, string> = {
  Education: "bg-cat-education",
  Health: "bg-cat-health",
  Housing: "bg-cat-housing",
  Utilities: "bg-cat-utilities",
};

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

/**
 * The swipe deck itself: keeps the cursor into the approved-bill list and lets
 * the top card throw itself away (drag or Skip) to reveal the next bill.
 *
 * "Give" opens the amount sheet ("Choose an amount") for the current bill; the
 * sheet's confirm button routes on to the bill detail where the donation is
 * finalised.
 */
function DiscoverDeck() {
  const { bills, error } = useApprovedBills();
  const [cursor, setCursor] = useState(0);
  const [swipes, setSwipes] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [amountSheetOpen, setAmountSheetOpen] = useState(false);

  const total = bills.length;
  const index = total > 0 ? cursor % total : 0;
  const top: ApprovedBill | null = total > 0 ? bills[index] : null;
  const next: ApprovedBill | null = total > 1 ? bills[(index + 1) % total] : null;
  const afterNext: ApprovedBill | null = total > 2 ? bills[(index + 2) % total] : null;

  const advance = useCallback((direction: SwipeDirection, bill: ApprovedBill) => {
    setCursor((value) => value + 1);
    setSwipes((value) => value + 1);
    setAnnouncement(
      direction === "right" ? `Thanks! Opening help for ${bill.title}` : `Skipped ${bill.title}`,
    );
  }, []);

  if (!top) {
    return (
      <p className="glass rounded-3xl p-6 text-sm text-muted-foreground">
        No bills to show yet. Check back soon.
      </p>
    );
  }

  return (
    <div
      data-testid="swipe-deck"
      data-swipes={swipes}
      data-index={index}
      className="mx-auto w-full max-w-md"
    >
      <div className="relative">
        {afterNext && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-20 translate-y-3 scale-[0.92] opacity-50"
          >
            <SwipeCard bill={afterNext} />
          </div>
        )}
        {next && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 translate-y-1.5 scale-[0.96] opacity-80"
          >
            <SwipeCard bill={next} />
          </div>
        )}
        <SwipeCard bill={top} interactive isTop eager onSwiped={advance} />
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => advance("left", top)}
          className="glass inline-flex items-center gap-2 rounded-full border border-input px-6 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/25"
        >
          <span aria-hidden="true">✕</span>
          Skip
        </button>
        <button
          type="button"
          onClick={() => setAmountSheetOpen(true)}
          aria-haspopup="dialog"
          className="bg-brand-gradient shadow-elegant inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          <span aria-hidden="true">♥</span>
          Give
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <span data-testid="deck-position">
          {index + 1} of {total}
        </span>{" "}
        · Drag the card left to skip or right to help
      </p>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {error && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Showing curated bills while we reconnect.
        </p>
      )}

      <AmountSheet
        open={amountSheetOpen}
        onOpenChange={setAmountSheetOpen}
        billId={top.id}
        billTitle={top.title}
        needed={Math.max(top.goal - top.raised, 0)}
      />
    </div>
  );
}

function DiscoverPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <section className="animate-fade-up">
        <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Verified · Real people</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Discover bills
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">Verified bills from people who need a hand right now.</p>
      </section>

      <section aria-label="Swipe deck" className="animate-fade-up mt-10">
        <DiscoverDeck />
      </section>

      <ul className="mt-12 space-y-5">
        {liveSampleBills.map((b, i) => (
          <li
            key={b.id}
            className="animate-fade-up glass shadow-elegant relative overflow-hidden rounded-2xl p-5 pl-7 transition-transform duration-200 hover:-translate-y-0.5"
            style={{ animationDelay: `${80 + i * 90}ms` }}
          >
            <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 ${accentClass[b.category] ?? "bg-primary"}`} />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CategoryBadge category={b.category} />
                <h2 className="mt-3 break-words text-xl font-semibold leading-snug">
                  <Link
                    to="/bills/$id"
                    params={{ id: b.id }}
                    className="after:absolute after:inset-0 hover:text-primary focus-visible:outline-none"
                  >
                    {b.title}
                  </Link>
                </h2>
                <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <PinIcon />
                  {b.city}
                </p>
              </div>
              <span className="bg-brand-gradient shrink-0 rounded-full px-3 py-1 text-sm font-bold text-primary-foreground">
                {fundedPercent(b.raised, b.goal)}%
              </span>
            </div>
            <ProgressBar
              value={b.raised}
              goal={b.goal}
              className="mt-4"
              label={`${b.title} funding progress`}
              testId="progress-bar"
            />
            <p className="mt-3 text-sm">
              <span className="font-semibold text-foreground">{formatNaira(b.raised)}</span>
              <span className="text-muted-foreground"> raised of {formatNaira(b.goal)}</span>
            </p>
          </li>
        ))}
      </ul>

      <Link
        to="/"
        className="glass mt-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <span aria-hidden="true">←</span> Back home
      </Link>
    </main>
  );
}
