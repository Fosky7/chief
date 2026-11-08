import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatNaira, parseNaira } from "@/lib/currency";
import { SwipeCard, type SwipeDirection } from "@/components/SwipeCard";
import { useApprovedBills, type DeckBill } from "@/hooks/useApprovedBills";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [{ title: "Discover bills — Chief" }],
  }),
  component: DiscoverPage,
});

const PRESET_AMOUNTS = [1000, 5000, 10000, 25000];
const MIN_AMOUNT = 100;
/** How many cards are rendered in the visual stack. */
const STACK_DEPTH = 3;

function DiscoverPage() {
  const { bills, loading, usingSample } = useApprovedBills();
  const [index, setIndex] = useState(0);
  const [giveBill, setGiveBill] = useState<DeckBill | null>(null);

  // When the data source swaps (sample -> live), restart the deck.
  const deckKey = useMemo(() => bills.map((b) => b.id).join("|"), [bills]);
  useEffect(() => {
    setIndex(0);
  }, [deckKey]);

  const current = bills[index] ?? null;
  const visible = bills.slice(index, index + STACK_DEPTH);
  const finished = bills.length > 0 && index >= bills.length;

  const next = useCallback(() => setIndex((i) => i + 1), []);

  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      const bill = bills[index];
      if (direction === "right" && bill) setGiveBill(bill);
      next();
    },
    [bills, index, next],
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <section className="animate-fade-up text-center">
        <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Verified · Real people</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Discover bills
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Swipe left to skip, swipe right to give. Every bill is verified and paid directly to the biller.
        </p>
        {usingSample && !loading && (
          <p className="mt-2 text-xs text-muted-foreground">Showing example bills while new requests are verified.</p>
        )}
      </section>

      <section aria-label="Bill deck" className="mx-auto mt-10 w-full max-w-sm">
        {finished || !current ? (
          <div className="glass shadow-elegant flex h-[560px] flex-col items-center justify-center rounded-3xl p-8 text-center">
            <h2 className="text-2xl font-semibold">You're all caught up</h2>
            <p className="mt-2 text-sm text-muted-foreground">You've seen every bill in the deck. Check back soon for more.</p>
            {bills.length > 0 && (
              <button
                type="button"
                onClick={() => setIndex(0)}
                className="bg-brand-gradient mt-6 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant"
              >
                Start over
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="relative h-[560px] w-full">
              {visible
                .map((bill, i) => (
                  <SwipeCard key={bill.id} bill={bill} stackIndex={i} onSwipe={i === 0 ? handleSwipe : undefined} />
                ))
                .reverse()}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground" aria-live="polite">
              {index + 1} of {bills.length}
            </p>

            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={next}
                className="glass inline-flex min-w-32 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/30"
              >
                <span aria-hidden="true">✕</span>
                Skip
              </button>
              <button
                type="button"
                onClick={() => setGiveBill(current)}
                className="bg-brand-gradient inline-flex min-w-32 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
              >
                <span aria-hidden="true">♥</span>
                Give
              </button>
            </div>
          </>
        )}
      </section>

      <div className="mt-10 text-center">
        <Link
          to="/"
          className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <span aria-hidden="true">←</span> Back home
        </Link>
      </div>

      {giveBill && <AmountSheet bill={giveBill} onClose={() => setGiveBill(null)} />}
    </main>
  );
}

interface AmountSheetProps {
  bill: DeckBill;
  onClose: () => void;
}

/** Bottom sheet that lets a donor choose how much to give to a bill. */
function AmountSheet({ bill, onClose }: AmountSheetProps) {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  const remaining = Math.max(0, bill.goal - bill.raised);
  const customValue = custom.trim() ? parseNaira(custom) : null;
  const amount = customValue ?? preset;
  const invalidCustom = custom.trim() !== "" && (customValue === null || customValue < MIN_AMOUNT);
  const canSubmit = amount !== null && amount >= MIN_AMOUNT && !invalidCustom;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onClose();
    if (!bill.isSample) {
      void navigate({ to: "/bills/$id", params: { id: bill.id } });
    } else {
      void navigate({ to: "/bills/$id", params: { id: bill.id } });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="amount-sheet-title"
        tabIndex={-1}
        className="animate-fade-up relative w-full max-w-md rounded-t-3xl bg-card p-6 shadow-elegant outline-none sm:rounded-3xl"
      >
        <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted sm:hidden" />
        <h2 id="amount-sheet-title" className="text-2xl font-semibold">
          Choose an amount
        </h2>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          For <span className="font-medium text-foreground">{bill.title}</span> · {formatNaira(remaining)} still needed
        </p>

        <form onSubmit={submit} className="mt-5 space-y-5">
          <div className="grid grid-cols-2 gap-3" role="group" aria-label="Preset amounts">
            {PRESET_AMOUNTS.map((value) => {
              const selected = preset === value && !custom.trim();
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setPreset(value);
                    setCustom("");
                  }}
                  className={`rounded-2xl border px-4 py-3 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {formatNaira(value)}
                </button>
              );
            })}
          </div>

          <div>
            <label htmlFor="custom-amount" className="text-sm font-medium">
              Or enter your own amount
            </label>
            <div className="mt-1.5 flex items-center rounded-2xl border border-border bg-background px-4 focus-within:ring-4 focus-within:ring-primary/30">
              <span aria-hidden="true" className="text-muted-foreground">
                ₦
              </span>
              <input
                id="custom-amount"
                inputMode="numeric"
                autoComplete="off"
                placeholder="2,500"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                aria-invalid={invalidCustom}
                aria-describedby="custom-amount-help"
                className="w-full bg-transparent px-2 py-3 text-base text-foreground outline-none"
              />
            </div>
            <p
              id="custom-amount-help"
              className={`mt-1 text-xs ${invalidCustom ? "text-destructive" : "text-muted-foreground"}`}
            >
              Minimum {formatNaira(MIN_AMOUNT)}.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="glass flex-1 rounded-full px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-brand-gradient flex-1 rounded-full px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canSubmit && amount !== null ? `Give ${formatNaira(amount)}` : "Give"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
