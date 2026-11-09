import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";
import { SwipeCard, type SwipeDirection } from "@/components/SwipeCard";
import { useApprovedBills } from "@/hooks/useApprovedBills";
import { formatNaira } from "@/lib/currency";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover bills" }] }),
  component: DiscoverPage,
});

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000];

function DiscoverPage() {
  const { bills, loading } = useApprovedBills();
  const [index, setIndex] = useState(0);
  const [backed, setBacked] = useState<{ id: string; amount: number }[]>([]);
  const [chooserOpen, setChooserOpen] = useState(false);

  const current = bills[index];
  const currentTitle = current
    ? String((current as unknown as Record<string, unknown>).title ?? "this bill")
    : "";

  const skip = () => {
    if (!current) return;
    setChooserOpen(false);
    setIndex((i) => i + 1);
  };

  const openGive = () => {
    if (!current) return;
    setChooserOpen(true);
  };

  // Drag/keyboard: left skips, right opens the amount chooser.
  const handleSwipe = (dir: SwipeDirection) => {
    if (dir === "left") skip();
    else openGive();
  };

  const confirmGive = (amount: number) => {
    if (!current) return;
    setBacked((b) => [...b, { id: current.id, amount }]);
    setChooserOpen(false);
    setIndex((i) => i + 1);
  };

  const totalPledged = backed.reduce((sum, b) => sum + b.amount, 0);

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
              aria-label="Skip"
              onClick={skip}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 font-semibold text-foreground shadow-sm transition hover:bg-muted"
            >
              <X className="h-5 w-5 text-destructive" />
              Skip
            </button>
            <button
              type="button"
              aria-label="Give"
              onClick={openGive}
              className="bg-brand-gradient flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Heart className="h-5 w-5" />
              Give
            </button>
          </div>
          {chooserOpen && (
            <AmountChooser
              billTitle={currentTitle}
              onCancel={() => setChooserOpen(false)}
              onConfirm={confirmGive}
            />
          )}
        </>
      ) : (
        <div data-testid="deck-empty" className="rounded-2xl border border-border p-6 text-center">
          <p className="font-semibold">You're all caught up!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You backed {backed.length} bill(s)
            {totalPledged > 0 ? ` with ${formatNaira(totalPledged)}` : ""}.
          </p>
          <button
            type="button"
            onClick={() => {
              setIndex(0);
              setBacked([]);
            }}
            className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Start over
          </button>
          <div className="mt-3">
            <Link to="/" className="text-sm text-primary underline">
              Back home
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

interface AmountChooserProps {
  billTitle: string;
  onCancel: () => void;
  onConfirm: (amount: number) => void;
}

/** Modal letting the user pick a preset or custom naira amount. */
function AmountChooser({ billTitle, onCancel, onConfirm }: AmountChooserProps) {
  const [selected, setSelected] = useState<number | null>(PRESET_AMOUNTS[1]);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const customValue = Number(custom.replace(/[^\d]/g, ""));
  const amount = custom.trim() ? customValue : selected ?? 0;
  const valid = Number.isFinite(amount) && amount >= 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="amount-chooser-title"
        data-testid="amount-chooser"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-lg"
      >
        <h2 id="amount-chooser-title" className="text-lg font-semibold">
          Choose an amount
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Support {billTitle}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {PRESET_AMOUNTS.map((a) => {
            const active = !custom.trim() && selected === a;
            return (
              <button
                key={a}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelected(a);
                  setCustom("");
                }}
                className={`rounded-2xl border px-4 py-3 font-semibold transition ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted/50 text-foreground hover:bg-muted"
                }`}
              >
                {formatNaira(a)}
              </button>
            );
          })}
        </div>
        <label className="mt-4 block text-sm font-medium" htmlFor="custom-amount">
          Or enter your own amount (₦)
        </label>
        <input
          id="custom-amount"
          inputMode="numeric"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. 3500"
          className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
        />
        {!valid && <p className="mt-2 text-xs text-destructive">Minimum amount is ₦100.</p>}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-border px-4 py-2.5 font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onConfirm(amount)}
            className="flex-1 rounded-full bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-50"
          >
            Give {valid ? formatNaira(amount) : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
