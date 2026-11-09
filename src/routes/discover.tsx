import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { SwipeCard, type SwipeDirection } from "@/components/SwipeCard";
import { useApprovedBills } from "@/hooks/useApprovedBills";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover bills" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { bills: allBills, loading } = useApprovedBills();
  const bills = allBills.filter((b) => !b.status || b.status === "approved");
  const [index, setIndex] = useState(0);
  const [backed, setBacked] = useState<string[]>([]);

  const current = bills[index];

  const handleSwipe = (dir: SwipeDirection) => {
    if (!current) return;
    if (dir === "right") setBacked((b) => [...b, current.id]);
    setIndex((i) => i + 1);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Discover bills</h1>
        <span data-testid="deck-progress" className="glass rounded-full px-3 py-1 text-sm font-medium text-muted-foreground">
          {Math.min(index + 1, bills.length)} of {bills.length}
        </span>
      </header>
      <p data-testid="backed-count" className="text-sm text-muted-foreground">
        Backed: {backed.length}
      </p>

      {loading && bills.length === 0 ? (
        <p className="text-muted-foreground">Loading bills…</p>
      ) : current ? (
        <>
          <SwipeCard key={current.id} bill={current} onSwipe={handleSwipe} />
          <div className="flex justify-center gap-6">
            <button
              type="button"
              aria-label="Pass"
              onClick={() => handleSwipe("left")}
              className="glass shadow-elegant flex h-14 w-14 items-center justify-center rounded-full text-destructive transition-transform hover:-translate-y-0.5"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Back this bill"
              onClick={() => handleSwipe("right")}
              className="bg-brand-gradient shadow-elegant flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <Check className="h-6 w-6" />
            </button>
          </div>
        </>
      ) : (
        <div data-testid="deck-empty" className="glass shadow-elegant rounded-3xl p-6 text-center">
          <p className="font-semibold text-foreground">You're all caught up!</p>
          <p className="mt-1 text-sm text-muted-foreground">You backed {backed.length} bill(s).</p>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setBacked([]);
            }}
            className="bg-brand-gradient mt-4 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Start over
          </button>
          <div className="mt-3">
            <Link to="/" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              Back home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
