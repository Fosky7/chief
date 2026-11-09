import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatNaira } from "@/lib/currency";

export interface AmountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Bill the chosen amount applies to. */
  billId: string;
  billTitle: string;
  /** Amount the bill still needs, in Naira (used for the "top up" preset). */
  needed?: number;
}

export const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000] as const;

/** Amounts are stored as whole naira in the input; parse defensively. */
function parseAmount(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return 0;
  const value = Number(digits);
  return Number.isFinite(value) ? value : 0;
}

/** Format a numeric amount with thousands separators (no ₦ symbol). */
function formatGrouped(value: number): string {
  return value.toLocaleString("en-NG");
}

/**
 * AmountSheet — the "Choose an amount" bottom sheet opened by the deck's Give
 * control.
 *
 * It renders as an accessible modal dialog (focus moved into the sheet, Escape
 * and backdrop click close it) with preset amounts plus a free-text naira input.
 * Confirming routes to the bill detail page where the donation is completed, so
 * no payment is started from the deck itself.
 */
export function AmountSheet({ open, onOpenChange, billId, billTitle, needed }: AmountSheetProps) {
  const [selected, setSelected] = useState<number>(PRESET_AMOUNTS[1]);
  const [custom, setCustom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const amount = useMemo(() => {
    const typed = parseAmount(custom);
    return typed > 0 ? typed : selected;
  }, [custom, selected]);

  // Reset the sheet each time it opens and move focus to the amount input.
  useEffect(() => {
    if (!open) return;
    setCustom("");
    setSelected(PRESET_AMOUNTS[1]);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Close on Escape while the sheet is open.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onOpenChange(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close amount sheet"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="amount-sheet-title"
        data-testid="amount-sheet"
        className="glass shadow-elegant relative w-full max-w-md animate-fade-up rounded-t-3xl border border-input p-6 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="amount-sheet-title" className="font-display text-xl font-semibold">
              Choose an amount
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Giving to <span className="font-medium text-foreground">{billTitle}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            aria-label="Close"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PRESET_AMOUNTS.map((preset) => {
            const active = amount === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSelected(preset);
                  setCustom("");
                }}
                aria-pressed={active}
                data-testid={`amount-preset-${preset}`}
                className={[
                  "rounded-2xl border px-3 py-3 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input bg-card text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {formatNaira(preset)}
              </button>
            );
          })}
          {needed && needed > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSelected(needed);
                setCustom("");
              }}
              aria-pressed={amount === needed}
              data-testid="amount-preset-needed"
              className={[
                "rounded-2xl border px-3 py-3 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
                amount === needed
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-card text-foreground hover:bg-muted",
              ].join(" ")}
            >
              {formatNaira(needed)}
            </button>
          ) : null}
        </div>

        <label htmlFor="custom-amount" className="mt-5 block text-sm font-semibold">
          Or enter another amount
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-input bg-card px-4 py-3 focus-within:ring-4 focus-within:ring-primary/20">
          <span aria-hidden="true" className="text-sm font-semibold text-muted-foreground">
            ₦
          </span>
          <input
            id="custom-amount"
            ref={inputRef}
            inputMode="numeric"
            autoComplete="off"
            placeholder={formatGrouped(selected)}
            value={custom}
            onChange={(event) => setCustom(event.target.value.replace(/[^0-9]/g, ""))}
            data-testid="custom-amount-input"
            className="w-full bg-transparent text-base font-semibold tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          You're giving <span className="font-semibold text-foreground">{formatNaira(amount)}</span>
        </p>

        <Link
          to="/bills/$id"
          params={{ id: billId }}
          className="bg-brand-gradient shadow-elegant mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          Continue with {formatNaira(amount)}
        </Link>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-2 w-full rounded-full px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AmountSheet;
