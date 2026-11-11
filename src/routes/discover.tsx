import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { SwipeCard, type SwipeCardBill } from "@/components/SwipeCard";
import { useApprovedBills } from "@/hooks/useApprovedBills";
import { sampleBills } from "@/lib/sampleBills";
import { formatNaira, parseNaira } from "@/lib/currency";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover bills" },
      { name: "description", content: "Swipe through approved bills and support the ones that matter to you." },
    ],
  }),
  component: DiscoverPage,
});

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000];
const MIN_AMOUNT = 100;

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

type GiveSheetProps = {
  bill: SwipeCardBill;
  isSample: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
};

/** Bottom sheet that lets the donor pick an amount for the current bill. */
function GiveSheet({ bill, isSample, onClose, onConfirm }: GiveSheetProps) {
  const [amount, setAmount] = useState<number>(PRESET_AMOUNTS[1]);
  const [custom, setCustom] = useState("");
  const firstButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    firstButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const remaining = Math.max(0, bill.goal - bill.raised);
  const chosen = custom.trim() ? parseNaira(custom) : amount;
  const valid = chosen >= MIN_AMOUNT;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="give-sheet-title"
        data-testid="give-sheet"
        className="relative w-full max-w-md rounded-t-3xl border border-border bg-card p-6 text-card-foreground shadow-elegant sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="give-sheet-title" className="text-xl font-semibold text-foreground">
              Choose an amount
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              For <span className="font-medium text-foreground">{bill.title}</span>
              {remaining > 0 ? ` · ${formatNaira(remaining)} still needed` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close amount sheet"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {PRESET_AMOUNTS.map((a, i) => {
            const active = !custom.trim() && amount === a;
            return (
              <button
                key={a}
                ref={i === 0 ? firstButton : undefined}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setAmount(a);
                  setCustom("");
                }}
                className={`rounded-2xl border px-4 py-3 text-base font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:border-primary/60"
                }`}
              >
                {formatNaira(a)}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="give-custom">
          Or enter your own amount
        </label>
        <input
          id="give-custom"
          inputMode="numeric"
          placeholder="₦"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
          className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        />
        {custom.trim() && !valid ? (
          <p className="mt-1.5 text-xs text-destructive">Minimum gift is {formatNaira(MIN_AMOUNT)}.</p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-input bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            Not now
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onConfirm(chosen)}
            className="bg-brand-gradient rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSample ? "Pledge" : "Give"} {valid ? formatNaira(chosen) : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscoverPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = (useApprovedBills as any)();
  const loading = Boolean(result?.loading ?? result?.isLoading ?? false);
  const isSample = Boolean(result?.isSample);
  const navigate = useNavigate();

  const deck = useMemo<SwipeCardBill[]>(() => {
    const live = extractList(result);
    const source = live.length > 0 ? live : extractList(sampleBills);
    return source.map(normalize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.bills, result?.data]);

  const [index, setIndex] = useState(0);
  const [supported, setSupported] = useState<string[]>([]);
  const [giving, setGiving] = useState<SwipeCardBill | null>(null);

  // If the deck source changes (sample -> live), restart from the top.
  useEffect(() => {
    setIndex(0);
    setSupported([]);
  }, [deck]);

  const current = deck[index];
  const done = !loading && index >= deck.length;

  const advance = () => setIndex((i) => i + 1);

  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Discover</h1>
        <p className="mt-1 text-sm text-muted-foreground">Swipe right to give, left to skip.</p>
        {!done && deck.length > 0 ? (
          <p data-testid="deck-counter" className="mt-3 text-xs text-muted-foreground">
            {Math.min(index + 1, deck.length)} / {deck.length}
          </p>
        ) : null}

        <div className="mt-8">
          {loading && deck.length === 0 ? (
            <p className="text-center text-muted-foreground">Loading bills…</p>
          ) : current ? (
            <SwipeCard
              key={current.id + "-" + index}
              bill={current}
              onSkip={advance}
              onSupport={() => setGiving(current)}
            />
          ) : (
            <div
              data-testid="deck-end"
              className="rounded-3xl border border-border bg-card p-8 text-center text-card-foreground"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold">You're all caught up</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You've seen every bill in the deck. You chose to support {supported.length}.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  data-testid="deck-restart"
                  onClick={() => {
                    setIndex(0);
                    setSupported([]);
                  }}
                  className="rounded-full border border-input px-5 py-2 text-sm hover:bg-muted"
                >
                  Start over
                </button>
                <Link
                  to="/"
                  className="bg-brand-gradient rounded-full px-5 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
                >
                  Back home
                </Link>
              </div>
            </div>
          )}
        </div>
        {isSample && !done ? (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Showing sample bills while approved bills load.
          </p>
        ) : null}
      </div>

      {giving ? (
        <GiveSheet
          bill={giving}
          isSample={isSample}
          onClose={() => setGiving(null)}
          onConfirm={() => {
            const bill = giving;
            setGiving(null);
            setSupported((s) => (s.includes(bill.id) ? s : [...s, bill.id]));
            advance();
            void navigate({ to: "/bills/$id", params: { id: bill.id } });
          }}
        />
      ) : null}
    </main>
  );
}
