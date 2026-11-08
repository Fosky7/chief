import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SwipeCard } from "@/components/SwipeCard";
import { formatNairaAmount, useApprovedBills } from "@/hooks/useApprovedBills";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [{ title: "Discover bills — Chief" }],
  }),
  component: DiscoverPage,
});

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

function DiscoverPage() {
  const { bills } = useApprovedBills();
  const [index, setIndex] = useState(0);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [giveOpen, setGiveOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  // Reset position if the bill list changes (e.g. live data replaces samples).
  useEffect(() => {
    setIndex(0);
  }, [bills]);

  const count = bills.length;
  const current = count > 0 ? bills[index % count] : null;

  const skip = useCallback(() => {
    if (count === 0 || exiting) return;
    setExiting("left");
    timer.current = window.setTimeout(() => {
      // Loop the deck so there is always a next bill to show.
      setIndex((i) => (i + 1) % count);
      setExiting(null);
    }, 250);
  }, [count, exiting]);

  const give = useCallback(() => {
    if (!current) return;
    setAmount(null);
    setGiveOpen(true);
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (giveOpen) {
        if (e.key === "Escape") setGiveOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") skip();
      if (e.key === "ArrowRight") give();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [giveOpen, skip, give]);

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:py-14">
      <section className="animate-fade-up text-center">
        <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Verified · Real people</p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Discover bills
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Swipe left to skip, right to give.</p>
      </section>

      <div className="relative mt-8 h-[30rem]">
        {count > 1 && (
          <div
            aria-hidden="true"
            className="absolute inset-0 translate-y-3 scale-95 rounded-3xl bg-muted shadow-sm"
          />
        )}
        {current ? (
          <SwipeCard key={`${current.id}-${index}`} bill={current} onSwipeLeft={skip} onSwipeRight={give} exiting={exiting} />
        ) : (
          <div className="glass flex h-full items-center justify-center rounded-3xl p-6 text-center text-muted-foreground">
            No bills to show right now. Check back soon.
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={skip}
          disabled={!current}
          className="rounded-full border border-border bg-background px-8 py-3 font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={give}
          disabled={!current}
          className="bg-brand-gradient rounded-full px-8 py-3 font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 disabled:opacity-50"
        >
          Give
        </button>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <span aria-hidden="true">←</span> Back home
        </Link>
      </div>

      {giveOpen && current && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
          onClick={() => setGiveOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="give-dialog-title"
            className="w-full max-w-sm rounded-3xl bg-card p-6 text-card-foreground shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="give-dialog-title" className="text-xl font-semibold">
              Choose an amount
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Supporting: {current.title}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={amount === a}
                  onClick={() => setAmount(a)}
                  className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${
                    amount === a
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {formatNairaAmount(a)}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setGiveOpen(false)}
                className="flex-1 rounded-full border border-border px-4 py-2 font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <Link
                to="/bills/$id"
                params={{ id: current.id }}
                aria-disabled={amount === null}
                onClick={(e) => {
                  if (amount === null) e.preventDefault();
                }}
                className={`bg-brand-gradient flex-1 rounded-full px-4 py-2 text-center font-semibold text-primary-foreground ${
                  amount === null ? "pointer-events-none opacity-50" : ""
                }`}
              >
                Continue
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
