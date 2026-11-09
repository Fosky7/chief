import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatNaira } from "@/lib/currency";

export interface AmountSheetProps {
  open: boolean;
  onClose: () => void;
  billTitle?: string;
  onContinue?: (amount: number) => void;
}

const PRESETS = [1000, 5000, 10000, 25000];

/**
 * "Choose an amount" sheet opened from the Give button on the swipe deck.
 * Shows naira presets plus a custom amount field.
 */
export function AmountSheet({ open, onClose, billTitle, onContinue }: AmountSheetProps) {
  const [amount, setAmount] = useState<number>(PRESETS[0]);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const trimmed = custom.trim();
  const value = trimmed ? Number(trimmed) : amount;
  const valid = Number.isFinite(value) && value > 0;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4 pt-16 sm:items-center sm:pb-16"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose an amount"
        data-testid="amount-sheet"
        className="glass shadow-elegant w-full max-w-md rounded-3xl border border-border/70 bg-card p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">Choose an amount</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {billTitle
                ? `Give towards ${billTitle}.`
                : "Every naira goes straight to a verified bill."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {PRESETS.map((preset) => {
            const selected = !trimmed && amount === preset;
            return (
              <button
                key={preset}
                type="button"
                data-testid={`amount-preset-${preset}`}
                aria-pressed={selected}
                onClick={() => {
                  setAmount(preset);
                  setCustom("");
                }}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-input bg-background/60 text-muted-foreground hover:border-primary/50"
                }`}
              >
                {formatNaira(preset)}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-sm font-semibold text-foreground">
          Or enter an amount (₦)
          <input
            data-testid="custom-amount-input"
            type="number"
            min={100}
            step={100}
            inputMode="numeric"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            placeholder="5000"
            className="mt-1.5 w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
        </label>

        <button
          type="button"
          data-testid="amount-continue"
          disabled={!valid}
          onClick={() => {
            if (!valid) return;
            onContinue?.(value);
            onClose();
          }}
          className="bg-brand-gradient shadow-elegant mt-5 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
        >
          Continue with {formatNaira(valid ? value : 0)}
        </button>
      </div>
    </div>
  );
}

export default AmountSheet;
