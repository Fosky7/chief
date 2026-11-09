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
  const { bills, loading } = useApprovedBills();
  const [index, setIndex] = useState(0);
  const [backed, setBacked] = useState<string[]>([]);

  const current = bills[index];

  const handleSwipe = (dir: SwipeDirection) => {
    if (!current) return;
    if (dir === "right") setBacked((b) => [...b, current.id]);
    setIndex((i) => i + 1);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Discover bills</h1>
        <span data-testid="deck-progress" className="text-sm text-muted-foreground">
          {Math.min(index + 1, bills.length)} of {bills.length}
        </span>
      </header>
      <p data-testid="backed-count" className="text-sm text-muted-foreground">
        Backed: {backed.length}
      </p>

      {loading && bills.length === 0 ? (
        <p>Loading bills…</p>
      ) : current ? (
        <>
          <SwipeCard key={current.id} bill={current} onSwipe={handleSwipe} />
          <div className="flex justify-center gap-6">
            <button
              type="button"
              aria-label="Pass"
              onClick={() => handleSwipe("left")}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-slate-800 text-rose-400"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Back this bill"
              onClick={() => handleSwipe("right")}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900"
            >
              <Check className="h-6 w-6" />
            </button>
          </div>
        </>
      ) : (
        <div data-testid="deck-empty" className="rounded-2xl border border-white/10 p-6 text-center">
          <p className="font-semibold">You're all caught up!</p>
          <p className="mt-1 text-sm text-muted-foreground">You backed {backed.length} bill(s).</p>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setBacked([]);
            }}
            className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-900"
          >
            Start over
          </button>
          <div className="mt-3">
            <Link to="/" className="text-sm text-emerald-300 underline">
              Back home
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
