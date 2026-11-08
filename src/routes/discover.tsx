import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SwipeCard, type SwipeCardBill } from "@/components/SwipeCard";
import { useApprovedBills } from "@/hooks/useApprovedBills";
import { sampleBills } from "@/lib/sampleBills";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover bills" },
      { name: "description", content: "Swipe through approved bills and support the ones that matter to you." },
    ],
  }),
  component: DiscoverPage,
});

function num(v: unknown): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, i: number): SwipeCardBill {
  return {
    id: String(raw?.id ?? `bill-${i}`),
    title: String(raw?.title ?? raw?.name ?? "Untitled bill"),
    description: String(raw?.description ?? raw?.summary ?? ""),
    category: String(raw?.category ?? "General"),
    goal: num(raw?.goal ?? raw?.amount ?? raw?.target ?? raw?.target_amount ?? raw?.amount_needed),
    raised: num(raw?.raised ?? raw?.amount_raised ?? raw?.raisedAmount ?? raw?.funded),
    image: raw?.image ?? raw?.image_url ?? raw?.imageUrl ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractList(result: any): unknown[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.bills)) return result.bills;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

function DiscoverPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = (useApprovedBills as any)();
  const loading = Boolean(result?.loading ?? result?.isLoading ?? false);
  const navigate = useNavigate();

  const deck = useMemo<SwipeCardBill[]>(() => {
    const live = extractList(result);
    const source = live.length > 0 ? live : extractList(sampleBills);
    return source.map(normalize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.bills, result?.data, result]);

  const [index, setIndex] = useState(0);
  const [supported, setSupported] = useState<string[]>([]);

  const current = deck[index];
  const done = !loading && index >= deck.length;

  const advance = () => setIndex((i) => i + 1);

  return (
    <main className="min-h-dvh px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="mt-1 text-sm text-white/70">
          Swipe right to support, left to skip.
        </p>
        {!done && deck.length > 0 ? (
          <p data-testid="deck-counter" className="mt-3 text-xs text-white/60">
            {Math.min(index + 1, deck.length)} / {deck.length}
          </p>
        ) : null}

        <div className="mt-8">
          {loading && deck.length === 0 ? (
            <p className="text-center text-white/70">Loading bills…</p>
          ) : current ? (
            <SwipeCard
              key={current.id + "-" + index}
              bill={current}
              onSkip={advance}
              onSupport={() => {
                setSupported((s) => [...s, current.id]);
                advance();
              }}
            />
          ) : (
            <div
              data-testid="deck-end"
              className="rounded-3xl border border-white/10 bg-neutral-900/80 p-8 text-center"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-black">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold">You're all caught up</h2>
              <p className="mt-2 text-sm text-white/70">
                You've seen every bill in the deck. You marked {supported.length} to support.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  data-testid="deck-restart"
                  onClick={() => {
                    setIndex(0);
                    setSupported([]);
                  }}
                  className="rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10"
                >
                  Start over
                </button>
                {supported[0] ? (
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/bills/$id", params: { id: supported[0] } })}
                    className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-black hover:bg-emerald-400"
                  >
                    Support now
                  </button>
                ) : (
                  <Link
                    to="/"
                    className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-black hover:bg-emerald-400"
                  >
                    Back home
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
