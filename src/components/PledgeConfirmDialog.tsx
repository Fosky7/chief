import { useCallback, useEffect, useId, useRef, useState } from "react";

import { buttons, surfaces, typography } from "@/config/theme";
import {
  ContributionError,
  confirmContribution,
  formatNairaAmount,
  type Contribution,
} from "@/services/contributions";

/**
 * Simulated payment confirmation dialog (Module 7).
 *
 * Flow:
 *  1. "Confirm your pledge" + the chosen amount (e.g. `₦1,000`).
 *  2. Donor presses "Confirm pledge" → simulated gateway call.
 *  3. "Contribution confirmed" with a receipt reference.
 *  4. `onConfirmed` fires so the deck can advance to the next request
 *     ("2 of 12").
 *
 * Built as a plain, accessible modal (focus, Escape, backdrop dismiss, live
 * region) so it carries no extra runtime dependency and never blocks keyboard
 * users behind an invisible overlay.
 */

type DialogPhase = "confirm" | "submitting" | "confirmed" | "error";

export interface PledgeConfirmDialogProps {
  /** Controls visibility. When false the dialog renders nothing. */
  open: boolean;
  /** Amount in whole Naira being pledged. */
  amount: number;
  /** Verified request the pledge belongs to. */
  recipientId?: string;
  /** Display name of the recipient. */
  recipientName?: string;
  /** Utility provider the bill belongs to. */
  biller?: string;
  /** Utility account number (shown on the receipt). */
  accountNumber?: string;
  /** Called when the donor dismisses the dialog (Escape, backdrop, Cancel, Done). */
  onCancel: () => void;
  /** Called once the simulated payment has been confirmed. */
  onConfirmed?: (contribution: Contribution) => void;
  /** Optional replacement for the simulated gateway (tests / future API). */
  submitContribution?: (amount: number) => Promise<Contribution>;
  className?: string;
}

export function PledgeConfirmDialog({
  open,
  amount,
  recipientId,
  recipientName,
  biller,
  accountNumber,
  onCancel,
  onConfirmed,
  submitContribution,
  className,
}: PledgeConfirmDialogProps) {
  const [phase, setPhase] = useState<DialogPhase>("confirm");
  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleId = useId();
  const descriptionId = useId();
  const primaryActionRef = useRef<HTMLButtonElement | null>(null);

  // A fresh open (or a new amount) always starts from the confirm step.
  useEffect(() => {
    if (!open) return;
    setPhase("confirm");
    setContribution(null);
    setErrorMessage(null);
  }, [open, amount]);

  const handleCancel = useCallback(() => {
    // Never dismiss mid-payment: the donor would lose the receipt.
    if (phase === "submitting") return;
    onCancel();
  }, [onCancel, phase]);

  // Escape closes the dialog.
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel, open]);

  // Lock background scrolling while the modal is up.
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Move focus to the primary action whenever the step changes.
  useEffect(() => {
    if (!open) return undefined;

    const frame = window.requestAnimationFrame(() => {
      primaryActionRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, phase]);

  const handleConfirm = useCallback(async () => {
    if (phase === "submitting") return;

    setPhase("submitting");
    setErrorMessage(null);

    try {
      const result = submitContribution
        ? await submitContribution(amount)
        : await confirmContribution({
            recipientId: recipientId ?? "discover-queue",
            amount,
            recipientName,
            biller,
            accountNumber,
          });

      setContribution(result);
      setPhase("confirmed");
      onConfirmed?.(result);
    } catch (error) {
      const message =
        error instanceof ContributionError
          ? error.message
          : "We could not confirm that pledge. Please try again.";

      setErrorMessage(message);
      setPhase("error");
    }
  }, [
    accountNumber,
    amount,
    biller,
    onConfirmed,
    phase,
    recipientId,
    recipientName,
    submitContribution,
  ]);

  if (!open) return null;

  const isConfirmed = phase === "confirmed";
  const isSubmitting = phase === "submitting";
  const displayAmount = formatNairaAmount(contribution?.amount ?? amount);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center ${
        className ?? ""
      }`}
    >
      {/* Backdrop — a button so pointer users can always dismiss. */}
      <button
        type="button"
        aria-label="Dismiss pledge confirmation"
        tabIndex={-1}
        onClick={handleCancel}
        className="absolute inset-0 h-full w-full cursor-default bg-foreground/40 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={isConfirmed ? undefined : descriptionId}
        className={`relative w-full max-w-md ${surfaces.card} p-6 shadow-xl`}
      >
        {isConfirmed ? (
          <div role="status" aria-live="polite" className="flex flex-col gap-4">
            <p className={typography.eyebrow}>Simulated payment</p>
            <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
              Contribution confirmed
            </h2>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {displayAmount}
            </p>
            <p className={typography.body}>
              {recipientName
                ? `Your pledge to ${recipientName}`
                : "Your pledge"}{" "}
              {biller ? `towards ${biller}` : "towards this bill"} has been
              recorded. This demo simulates the payment — no card is charged.
            </p>

            <dl className={`space-y-1 ${typography.caption}`}>
              {contribution?.reference ? (
                <div className="flex items-center justify-between gap-3">
                  <dt>Reference</dt>
                  <dd className="font-medium text-foreground">
                    {contribution.reference}
                  </dd>
                </div>
              ) : null}
              {accountNumber ? (
                <div className="flex items-center justify-between gap-3">
                  <dt>Account</dt>
                  <dd className="font-medium text-foreground tabular-nums">
                    {accountNumber}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <dt>Status</dt>
                <dd className="font-medium text-foreground">Confirmed</dd>
              </div>
            </dl>

            <button
              ref={primaryActionRef}
              type="button"
              onClick={handleCancel}
              className={`${buttons.primary} w-full justify-center`}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className={typography.eyebrow}>Simulated payment</p>
            <h2 id={titleId} className="text-2xl font-semibold tracking-tight">
              Confirm your pledge
            </h2>
            <p id={descriptionId} className={typography.body}>
              {`You are about to pledge ${displayAmount}`}
              {biller ? ` towards ${biller}` : ""}
              {recipientName ? ` for ${recipientName}` : ""}. This demo simulates
              the payment — no card is charged.
            </p>
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {displayAmount}
            </p>

            {errorMessage ? (
              <p
                role="alert"
                className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
              >
                {errorMessage}
              </p>
            ) : null}

            {isSubmitting ? (
              <p role="status" aria-live="polite" className={typography.caption}>
                Confirming your pledge…
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <button
                ref={primaryActionRef}
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={`${buttons.primary} w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
              >
                Confirm pledge
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className={`${buttons.secondary} w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
              >
                Cancel
              </button>
            </div>

            <p className={typography.caption}>
              Funds release to the provider, never to a stranger.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PledgeConfirmDialog;
