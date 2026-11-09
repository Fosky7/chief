import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Heart, X } from "lucide-react";
import { SwipeCard, type SwipeDirection } from "@/components/SwipeCard";
import { ProgressBar } from "@/components/ProgressBar";
import { AmountSheet } from "@/components/AmountSheet";
import { useApprovedBills } from "@/hooks/useApprovedBills";
import { formatNaira, fundedPercent } from "@/lib/currency";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover bills — Chief" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { bills, loading } = useApprovedBills();
  const [index, setIndex] = useState(0);
  const [swipes, setSwipes] = useState(0);
  const [backed, setBacked] = useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const total = bills.length;
  const current = index < total ? bills[index] : undefined;
  const position = total === 0 ? 0 : Math.min(index + 1, total);

  function advance() {
    setSwipes((n) => n + 1);
    setIndex((i) => i + 1);
  }

  function handleSwipe(direction: SwipeDirection) {
    if (!current) return;
    if (direction === "right") setBacked((prev) => [...prev, String(current.id)]);
    advance();
  }

  function startOver() {
    setIndex(0);
    setBacked([]);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Discover bills</h1>
        <span data-testid="deck-position" className="text-sm text-muted-foreground">
          {position} of {total}
        </span>
      </header>
      <p data-testid="backed-count" className="mt-1 text-sm text-muted-foreground">
        Backed: {backed.length}
      </p>

      <div className="mx-auto mt-6 w-full max-w-md">
        <div data-testid="swipe-deck" data-swipes={swipes} className="relative">
          {current ? (
            <SwipeCard key={String(current.id)} bill={current} onSwipe={handleSwipe} />
          ) : loading && total === 0 ? (
            <div className="glass rounded-3xl border border-border/70 p-6 text-center text-sm text-muted-foreground">
              Loading bills…
            </div>
          ) : (
            <div
              data-testid="deck-empty"
              className="glass rounded-3xl border border-border/70 p-8 text-center"
            >
              <p className="font-semibold text-foreground">You&apos;re all caught up!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You backed {backed.length} bill(s).
              </p>
              <button
                type="button"
                onClick={startOver}
                className="bg-brand-gradient shadow-elegant mt-4 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Start over
              </button>
            </div>
          )}
        </div>

        {current && (
          <div className="mt-5 flex items-center justify-center gap-6">
            <button
              type="button"
              aria-label="Skip"
              onClick={() => handleSwipe("left")}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/40 bg-card text-destructive transition-colors hover:bg-destructive/10"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Give"
              onClick={() => setSheetOpen(true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900 shadow-elegant transition-transform hover:-translate-y-0.5"
            >
              <Heart className="h-6 w-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Back this bill"
              onClick={() => handleSwipe("right")}
              className="sr-only"
            >
              <Check className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <section aria-label="All live bills" className="mt-14">
        <h2 className="text-lg font-semibold text-foreground">Live bills on Chief</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every bill is reviewed before it goes live. Open one to read the full story.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {bills.map((bill) => {
            const title: string = bill?.title || "Untitled bill";
            const amount = Number(bill?.amount ?? bill?.goal ?? 0) || 0;
            const raised = Number(bill?.raised ?? 0) || 0;
            const pct = fundedPercent(raised, amount);
            return (
              <li
                key={String(bill.id)}
                className="glass shadow-elegant rounded-3xl border border-border/70 p-5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                    {bill?.category ?? "General"}
                  </span>
                  {bill?.location && (
                    <span className="text-muted-foreground">{bill.location}</span>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug text-foreground">
                  <Link
                    to="/bills/$id"
                    params={{ id: String(bill.id) }}
                    className="underline-offset-4 transition-colors hover:text-primary hover:underline"
                  >
                    {title}
                  </Link>
                </h3>
                <ProgressBar
                  className="mt-4 bg-muted"
                  value={pct}
                  label={`${title} funding progress`}
                />
                <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
                  <span className="font-semibold text-foreground">{formatNaira(raised)}</span>
                  <span className="text-muted-foreground">of {formatNaira(amount)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <AmountSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        billTitle={current?.title}
      />
    </main>
  );
}
