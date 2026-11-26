import { useEffect, useId, useState } from "react";
import { X, Heart, Loader2 } from "lucide-react";
import { formatNaira, parseNairaInput, sanitizeNairaInput } from "@/lib/currency";

export const PRESET_AMOUNTS = [1000, 5000, 10000] as const;
export const MIN_DONATION = 100;

type Choice = { kind: "preset"; amount: number } | { kind: "remaining" } | null;

export type DonateSheetProps = {
  open: boolean;
  onClose: () => void;
  billTitle: string;
  /** Amount still needed for this bill, in whole naira. */
  remaining: number;
  /** Called with the chosen whole-naira amount when the donor confirms. */
  onPay: (amount: number) => Promise<void> | void;
};

/**
 * "Choose an amount" bottom sheet: preset amounts, "Pay remaining" and a
 * custom amount field. The actual checkout is delegated to `onPay`.
 */
export function DonateSheet({ open, onClose, billTitle, remaining, onPay }: DonateSheetProps) {
  const headingId = useId();
  const customId = useId();
  const [choice, setChoice] = useState<Choice>(null);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset each time the sheet opens.
  useEffect(() => {
    if (open) {
      setChoice(null);
      setCustom("");
      setBusy(false);
      setError(null);
    }
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

  const remainingSafe = Math.max(0, Math.round(remaining));
  const customAmount = parseNairaInput(custom);
  const amount: number | null =
    customAmount !== null
      ? customAmount
      : choice?.kind === "preset"
        ? choice.amount
        : choice?.kind === "remaining"
          ? remainingSafe
          : null;

  const tooSmall = amount !== null && amount < MIN_DONATION;
  const canPay = amount !== null && !tooSmall && !busy;

  const handlePay = async () => {
    if (amount === null || tooSmall) return;
    setBusy(true);
    setError(null);
    try {
      await onPay(amount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const chipClass = (active: boolean) =>
    `rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
      active ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={() => !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-background p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={headingId} className="text-lg font-bold">
            Choose an amount
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} disabled={busy}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">For: {billTitle}</p>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_AMOUNTS.map((a) => {
            const active = customAmount === null && choice?.kind === "preset" && choice.amount === a;
            return (
              <button
                key={a}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setCustom("");
                  setChoice({ kind: "preset", amount: a });
                }}
                className={chipClass(active)}
              >
                {formatNaira(a)}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={customAmount === null && choice?.kind === "remaining"}
            disabled={remainingSafe <= 0}
            onClick={() => {
              setCustom("");
              setChoice({ kind: "remaining" });
            }}
            className={`${chipClass(customAmount === null && choice?.kind === "remaining")} disabled:opacity-50`}
          >
            Pay remaining
          </button>
        </div>

        <div className="mt-4">
          <label htmlFor={customId} className="mb-1 block text-sm font-medium">
            Custom amount
          </label>
          <div className="flex items-center rounded-lg border px-3 focus-within:ring-2 focus-within:ring-primary">
            <span className="text-muted-foreground">₦</span>
            <input
              id={customId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Enter amount"
              value={custom}
              onChange={(e) => setCustom(sanitizeNairaInput(e.target.value))}
              className="w-full bg-transparent px-2 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">You give</span>
          <span data-testid="donate-total" className="text-base font-semibold">
            {amount !== null ? formatNaira(amount) : "—"}
          </span>
        </div>
        {remainingSafe > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatNaira(remainingSafe)} still needed
          </p>
        )}

        {tooSmall && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Minimum donation is {formatNaira(MIN_DONATION)}.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!canPay}
          onClick={handlePay}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
          Donate with Paystack
        </button>
      </div>
    </div>
  );
}

export default DonateSheet;
