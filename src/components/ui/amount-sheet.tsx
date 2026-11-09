/**
 * `AmountSheet` — the "Choose an amount" giving sheet.
 *
 * Controlled, accessible modal/bottom-sheet that lets a donor either tap a
 * preset or type a custom figure before continuing to checkout.
 *
 * Key behaviours:
 * - The amount input is fully controlled, so whatever the donor types stays
 *   visible (we only ever strip non-digits, never re-format the raw value).
 * - A live summary confirms the chosen amount in ₦ with thousands separators.
 * - Bound by `minAmount` and, when the bill has an outstanding balance, by the
 *   remaining amount (`goal - raised`).
 * - Escape / backdrop click / close button all dismiss the sheet.
 */
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { formatNaira, toFiniteNumber } from "@/lib/currency";

/** Minimal bill shape the sheet needs; extra fields are ignored. */
export type AmountSheetBill = {
  id?: string;
  title?: string;
  /** Total amount needed, in whole Naira. */
  goal?: number;
  /** Amount already raised, in whole Naira. */
  raised?: number;
  /** Explicit amount still needed; wins over `goal - raised` when supplied. */
  remaining?: number;
};

export type AmountSheetConfirmHandler = (
  amount: number,
  note: string,
) => void | Promise<void>;

export type AmountSheetProps = {
  /** Defaults to `true` so a parent may render the sheet conditionally. */
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  bill?: AmountSheetBill | null;
  heading?: string;
  minAmount?: number;
  maxAmount?: number;
  presets?: readonly number[];
  initialAmount?: number | string | null;
  onConfirm?: AmountSheetConfirmHandler;
  /** Alias for `onConfirm`, kept for deck implementations that use `onGive`. */
  onGive?: AmountSheetConfirmHandler;
  className?: string;
};

const DEFAULT_MIN_AMOUNT = 100;
const DEFAULT_PRESETS: readonly number[] = [1000, 2500, 5000, 10000, 25000];
const MAX_DIGITS = 12;

/** Tiny local class joiner so this file has no extra runtime dependencies. */
function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/** Keeps only the digits of an amount so the input always holds a raw number. */
function toDigits(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const parsed = toFiniteNumber(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return String(Math.round(parsed)).slice(0, MAX_DIGITS);
}

export function AmountSheet({
  open,
  onClose,
  onOpenChange,
  bill,
  heading = "Choose an amount",
  minAmount = DEFAULT_MIN_AMOUNT,
  maxAmount,
  presets,
  initialAmount = null,
  onConfirm,
  onGive,
  className,
}: AmountSheetProps) {
  const isOpen = open ?? true;

  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();
  const noteId = useId();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [rawAmount, setRawAmount] = useState<string>(() => toDigits(initialAmount));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    onOpenChange?.(false);
    onClose?.();
  }, [onClose, onOpenChange]);

  // Reset on every open so a previous donor's amount never leaks through.
  useEffect(() => {
    if (!isOpen) return;
    setRawAmount(toDigits(initialAmount));
    setNote("");
    setBusy(false);
    setError(null);
    setStatus(null);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(focusTimer);
  }, [initialAmount, isOpen]);

  // Escape to dismiss + lock background scrolling while the sheet is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [handleClose, isOpen]);

  const amount = useMemo(() => toFiniteNumber(rawAmount), [rawAmount]);

  const remaining = useMemo(() => {
    if (!bill) return 0;
    if (bill.remaining !== undefined) return Math.max(0, toFiniteNumber(bill.remaining));
    const goal = toFiniteNumber(bill.goal);
    const raised = toFiniteNumber(bill.raised);
    return goal > 0 ? Math.max(0, goal - raised) : 0;
  }, [bill]);

  const upperBound = maxAmount ?? (remaining > 0 ? remaining : Number.POSITIVE_INFINITY);
  const capped = Number.isFinite(upperBound);

  const validationMessage = useMemo(() => {
    if (rawAmount.length === 0) return null;
    if (amount < minAmount) return `Minimum donation is ${formatNaira(minAmount)}.`;
    if (capped && amount > upperBound) {
      return `You can give up to ${formatNaira(upperBound)} for this bill.`;
    }
    return null;
  }, [amount, capped, minAmount, rawAmount, upperBound]);

  const canSubmit = rawAmount.length > 0 && validationMessage === null;
  const presetList = presets ?? DEFAULT_PRESETS;

  const handleAmountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // Strip everything that is not a digit so `1,000` and `1000` behave alike.
    const digits = event.target.value.replace(/[^0-9]/g, "").slice(0, MAX_DIGITS);
    setRawAmount(digits);
    setStatus(null);
    setError(null);
  }, []);

  const selectPreset = useCallback((value: number) => {
    setRawAmount(String(value));
    setStatus(null);
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (busy) return;

      if (rawAmount.length === 0) {
        setError(`Enter an amount of at least ${formatNaira(minAmount)}.`);
        return;
      }
      if (amount < minAmount) {
        setError(`Minimum donation is ${formatNaira(minAmount)}.`);
        return;
      }
      if (capped && amount > upperBound) {
        setError(`You can give up to ${formatNaira(upperBound)} for this bill.`);
        return;
      }

      setError(null);
      const handler = onConfirm ?? onGive;
      const trimmedNote = note.trim();
      const successMessage = `You're giving ${formatNaira(amount)}${
        bill?.title ? ` to ${bill.title}` : ""
      }. Secure checkout opens next.`;

      if (!handler) {
        setStatus(successMessage);
        return;
      }

      try {
        setBusy(true);
        await handler(amount, trimmedNote);
        setStatus(successMessage);
      } catch (handlerError) {
        setError(
          handlerError instanceof Error
            ? handlerError.message
            : "We could not start that donation. Please try again.",
        );
      } finally {
        setBusy(false);
      }
    },
    [amount, bill?.title, busy, capped, minAmount, note, onConfirm, onGive, rawAmount, upperBound],
  );

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) handleClose();
    },
    [handleClose],
  );

  if (!isOpen) return null;

  const visibleError = error ?? validationMessage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={handleBackdropClick}
      data-testid="amount-sheet-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        data-testid="amount-sheet"
        className={cx(
          "animate-fade-up w-full max-w-md rounded-3xl bg-card p-6 shadow-elegant outline-none",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={titleId}
              data-testid="amount-sheet-title"
              className="font-display text-2xl font-semibold"
            >
              {heading}
            </h2>
            <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
              {bill?.title ? (
                <>
                  Supporting{" "}
                  <span className="font-medium text-foreground">{bill.title}</span>
                </>
              ) : (
                "Every naira goes to a verified bill."
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            data-testid="amount-sheet-close"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
          >
            ✕
          </button>
        </div>

        {remaining > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {formatNaira(remaining)} still needed
          </p>
        )}

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-4" noValidate>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Preset amounts">
            {presetList.map((preset) => {
              const selected = rawAmount === String(preset);
              const presetDisabled = capped && preset > upperBound;

              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={selected}
                  disabled={presetDisabled}
                  onClick={() => selectPreset(preset)}
                  data-testid={`amount-preset-${preset}`}
                  className={cx(
                    "rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-foreground hover:border-primary/50",
                  )}
                >
                  {formatNaira(preset)}
                </button>
              );
            })}
          </div>

          <label htmlFor={inputId} className="block text-sm font-semibold">
            Amount (₦)
            <input
              id={inputId}
              ref={inputRef}
              name="amount"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]*"
              value={rawAmount}
              onChange={handleAmountChange}
              placeholder="e.g. 7500"
              aria-describedby={visibleError ? `${inputId}-error` : undefined}
              data-testid="amount-input"
              className="mt-1.5 w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
          </label>

          <label htmlFor={noteId} className="block text-sm font-semibold">
            Add a note (optional)
            <textarea
              id={noteId}
              name="note"
              rows={2}
              maxLength={200}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Say something kind"
              data-testid="amount-note"
              className="mt-1.5 w-full resize-none rounded-xl border border-input bg-background/80 px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
          </label>

          {amount > 0 && (
            <p
              data-testid="amount-summary"
              className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary"
            >
              {`You're giving ${formatNaira(amount)}`}
              {bill?.title ? ` to ${bill.title}` : ""}
            </p>
          )}

          {visibleError && (
            <p
              id={`${inputId}-error`}
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
            >
              {visibleError}
            </p>
          )}

          {status && (
            <p
              role="status"
              data-testid="amount-status"
              className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
            >
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || busy}
            data-testid="amount-continue"
            className="bg-brand-gradient shadow-elegant w-full rounded-full px-6 py-3.5 font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Starting…" : "Continue"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Paid directly to the biller · Secured by Paystack
          </p>
        </form>
      </div>
    </div>
  );
}

/** Aliases so consumers can import whichever name reads best at the call site. */
export const AmountSheetDialog = AmountSheet;
export const ChooseAmountSheet = AmountSheet;

export default AmountSheet;
