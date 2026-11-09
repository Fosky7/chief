import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SwipeCard, type SwipeCardBill } from "@/components/SwipeCard";
import { useApprovedBills } from "@/hooks/useApprovedBills";
import { sampleBills } from "@/lib/sampleBills";
import { formatNaira } from "@/lib/currency";

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

type AmountDialogProps = {
  bill: SwipeCardBill;
  onCancel: () => void;
  onConfirm: (amount: number) => void;
};

/** Modal letting the donor pick how much to give to the current bill. */
function AmountDialog({ bill, onCancel, onConfirm }: AmountDialogProps) {
  const [selected, setSelected] = useState<number | null>(PRESET_AMOUNTS[1]);
  const [custom, setCustom] = useState("");
  const firstRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const customValue = Math.round(Number(custom.replace(/[^0-9]/g, "")));
  const amount = custom.trim() !== "" ? customValue : selected ?? 0;
  const valid = Number.isFinite(amount) && amount >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="amount-dialog-title"
        data-testid="amount-dialog"
        onClick={(e) => e.stopPropagation()}
        className="shadow-elegant w-full max-w-md rounded-3xl bg-card p-6 text-card-foreground"
      >
        <h2 id="amount-dialog-title" className="text-xl font-semibold text-foreground">
          Choose an amount
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Giving to {bill.title}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {PRESET_AMOUNTS.map((a, i) => {
            const active = custom.trim() === "" && selected === a;
            return (
              <button
                key={a}
                ref={i === 0 ? firstRef : undefined}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelected(a);
                  setCustom("");
                }}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-foreground hover:bg-muted"
                }`}
              >
                {formatNaira(a)}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="custom-amount">
          Or enter your own
        </label>
        <input
          id="custom-amount"
          inputMode="numeric"
          placeholder="e.g. 3500"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
        />
        {custom.trim() !== "" && !valid ? (
          <p className="mt-1.5 text-xs text-destructive">Minimum amount is {formatNaira(100)}.</p>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-input px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onConfirm(amount)}
            className="bg-brand-gradient shadow-elegant flex-1 rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            Continue{valid ? ` · ${formatNaira(amount)}` : ""}
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
  const navigate = useNavigate();

  const deck = useMemo<SwipeCardBill[]>(() => {
    const live = extractList(result);
    const source = live.length > 0 ? live : extractList(sampleBills);
    return source.map(normalize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.bills, result?.data, result]);

  const [index, setIndex] = useState(0);
  const [supported, setSupported] = useState<string[]>([]);
  const [giving, setGiving] = useState<SwipeCardBill | null>(null);
  // Bumped to remount (reset) the top card when a Give is cancelled.
  const [cardNonce, setCardNonce] = useState(0);
  const [lastPledge, setLastPledge] = useState<string | null>(null);

  const current = deck[index];
  const done = !loading && index >= deck.length;

  const advance = () => setIndex((i) => i + 1);

  return (
    <main className="min-h-dvh px-4 py-10 text-white">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-bold">Discover bills</h1>
        <p className="mt-1 text-sm text-white/70">
          Swipe right to support, left to skip.
        </p>
        {!done && deck.length > 0 ? (
          <p data-testid="deck-counter" className="mt-3 text-xs text-white/60">
            {Math.min(index + 1, deck.length)} / {deck.length}
          </p>
        ) : null}
        {lastPledge ? (
          <p role="status" data-testid="pledge-status" className="mt-2 text-xs text-white/80">
            {lastPledge}
          </p>
        ) : null}

        <div className="mt-8">
          {loading && deck.length === 0 ? (
            <p className="text-center text-white/70">Loading bills…</p>
          ) : current ? (
            <SwipeCard
              key={`${current.id}-${index}-${cardNonce}`}
              bill={current}
              onSkip={advance}
              onSupport={() => setGiving(current)}
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
                    setLastPledge(null);
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

      {giving ? (
        <AmountDialog
          bill={giving}
          onCancel={() => {
            setGiving(null);
            setCardNonce((n) => n + 1);
          }}
          onConfirm={(amount) => {
            const bill = giving;
            setSupported((s) => (s.includes(bill.id) ? s : [...s, bill.id]));
            setLastPledge(`Thanks! You chose to give ${formatNaira(amount)} to ${bill.title}.`);
            setGiving(null);
            advance();
          }}
        />
      ) : null}
    </main>
  );
}
