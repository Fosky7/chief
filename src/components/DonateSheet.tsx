import { useEffect, useRef, useState } from "react";
import { formatNaira } from "@/lib/currency";

/** Fixed quick-pick amounts in Naira. */
export const DONATION_PRESETS = [1000, 5000, 10000] as const;

/** Smallest donation accepted (Paystack minimum safety margin). */
export const MIN_DONATION = 100;

export type DonateSheetProps = {
  /** Whether the sheet is visible. */
  open: boolean;
  /** Close handler (backdrop, Escape key, close button). */
  onClose: () => void;
  /** Bill title, used for context in the sheet. */
  billTitle: string;
  /** Amount still needed on the bill in Naira. */
  remaining: number;
  /**
   * Starts the checkout for the chosen amount (in Naira).
   * Wired by the caller to the payments service (Paystack).
   * Throwing an Error shows its message inside the sheet.
   */
  onPay: (amount: number) => Promise<void> | void;
};

type Choice = { kind: "preset"; amount: number } | { kind: "remaining" } | { kind: "custom" };

function parseCustom(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return NaN;
  return Math.round(Number(cleaned));
}

/**
 * "Choose an amount" donation sheet.
 * Presents preset amounts, a "Pay remaining" shortcut and a custom amount field,
 * validates the selection, then hands the amount to `onPay`.
 */
export function DonateSheet({ open, onClose, billTitle, remaining, onPay }: DonateSheetProps) {
  const safeRemaining = Math.max(0, Math.round(remaining));
  const [choice, setChoice] = useState<Choice>({ kind: "preset", amount: 5000 });
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset state whenever the sheet re-opens.
  useEffect(() => {
    if (!open) return;
    setChoice({ kind: "preset", amount: 5000 });
    setCustom("");
    setError(null);
    setBusy(false);
    panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const chosen =
    choice.kind === "preset" ? choice.amount : choice.kind === "remaining" ? safeRemaining : parseCustom(custom);
  const maxAllowed = Math.max(safeRemaining, MIN_DONATION);
  const valid = Number.isFinite(chosen) && chosen >= MIN_DONATION && chosen <= maxAllowed;
  const fullyFunded = safeRemaining === 0;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onPay(chosen);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const optionClass = (selected: boolean, disabled?: boolean) =>
    `rounded-xl border px-3 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
      selected ? "border-primary bg-primary/10 text-primary" : "border-input text-foreground hover:border-primary/50"
    } ${disabled ? "cursor-not-allowed opacity-50" : ""}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => !busy && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donate-sheet-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-md rounded-3xl bg-card p-6 text-card-foreground shadow-elegant outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="donate-sheet-title" className="font-display text-2xl font-semibold">
              Choose an amount
            </h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{billTitle}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatNaira(safeRemaining)} still needed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {fullyFunded ? (
          <p role="status" className="mt-6 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
            This bill is fully funded. Thank you!
          </p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Preset amounts">
              {DONATION_PRESETS.map((p) => {
                const selected = choice.kind === "preset" && choice.amount === p;
                const disabled = p > maxAllowed;
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={selected}
                    disabled={disabled}
                    onClick={() => {
                      setChoice({ kind: "preset", amount: p });
                      setCustom("");
                    }}
                    className={optionClass(selected, disabled)}
                  >
                    {formatNaira(p)}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={choice.kind === "remaining"}
                title={formatNaira(safeRemaining)}
                onClick={() => {
                  setChoice({ kind: "remaining" });
                  setCustom("");
                }}
                className={optionClass(choice.kind === "remaining")}
              >
                Pay remaining
              </button>
            </div>

            <label className="mt-4 block text-sm font-semibold">
              Custom amount
              <input
                type="text"
                inputMode="numeric"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  setChoice({ kind: "custom" });
                }}
                placeholder="e.g. 2500"
                className="mt-1.5 w-full rounded-xl border border-input bg-background/80 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
            </label>

            <p className="mt-3 text-sm text-muted-foreground">
              You're giving{" "}
              <span data-testid="donate-chosen-amount" className="font-semibold text-foreground">
                {Number.isFinite(chosen) ? formatNaira(chosen) : "—"}
              </span>
            </p>
            {!valid && (
              <p className="mt-1 text-xs text-destructive">
                Enter between {formatNaira(MIN_DONATION)} and {formatNaira(maxAllowed)}.
              </p>
            )}

            <button
              type="button"
              disabled={!valid || busy}
              onClick={() => void submit()}
              className="bg-brand-gradient shadow-elegant mt-6 w-full rounded-full px-6 py-3.5 font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Opening Paystack…" : "Donate with Paystack"}
            </button>
            {error && (
              <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Paid directly to the biller · Secured by Paystack
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default DonateSheet;
