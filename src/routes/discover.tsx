import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, Check, ChevronRight } from "lucide-react";
import { useApprovedBills } from "@/hooks/useApprovedBills";
import { SwipeCard } from "@/components/SwipeCard";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover bills" },
      { name: "description", content: "Swipe through approved bills and choose who to support." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { data: bills = [], isLoading } = useApprovedBills();
  const [index, setIndex] = useState(0);
  const [liked, setLiked] = useState<string[]>([]);

  const current = bills[index];
  const done = !isLoading && index >= bills.length;

  const swipe = (dir: "left" | "right") => {
    if (!current) return;
    if (dir === "right") setLiked((l) => [...l, current.id]);
    setIndex((i) => i + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") swipe("left");
      if (e.key === "ArrowRight") swipe("right");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold text-white">Discover bills</h1>
      {isLoading && <p className="text-white/70">Loading bills…</p>}
      {!isLoading && bills.length > 0 && !done && (
        <p data-testid="deck-counter" className="text-sm text-white/60">
          {index + 1} of {bills.length}
        </p>
      )}
      {current && (
        <>
          <SwipeCard key={current.id} bill={current} onSwipe={swipe} />
          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label="Skip"
              data-testid="skip-button"
              onClick={() => swipe("left")}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              <X />
            </button>
            <Link
              to="/bills/$id"
              params={{ id: current.id }}
              data-testid="view-bill-link"
              className="flex items-center gap-1 text-sm text-cyan-300 hover:underline"
            >
              Details <ChevronRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              aria-label="Fund"
              data-testid="fund-button"
              onClick={() => swipe("right")}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-400"
            >
              <Check />
            </button>
          </div>
        </>
      )}
      {done && (
        <div data-testid="deck-empty" className="space-y-4 text-center">
          <p className="text-xl font-semibold text-white">You're all caught up</p>
          <p data-testid="liked-count" className="text-white/70">
            You chose to support {liked.length} bill{liked.length === 1 ? "" : "s"}.
          </p>
          <button
            type="button"
            data-testid="restart-deck"
            onClick={() => {
              setIndex(0);
              setLiked([]);
            }}
            className="rounded-full bg-white/10 px-5 py-2 text-white hover:bg-white/20"
          >
            Start over
          </button>
        </div>
      )}
    </main>
  );
}
