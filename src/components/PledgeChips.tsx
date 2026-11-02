import { useCallback, useMemo, useState } from "react";

import { PledgeConfirmDialog } from "@/components/PledgeConfirmDialog";
import { buttons, typography } from "@/config/theme";
import {
  DEFAULT_PLEDGE_AMOUNT,
  PRESET_PLEDGE_AMOUNTS,
  formatNairaAmount,
  normalizePledgeAmount,
  type Contribution,
} from "@/services/contributions";

/**
 * Preset pledge chips + simulated checkout (Module 7).
 *
 * Renders the three preset amounts — `₦1,000`, `₦2,500`, `₦5,000` — with
 * `₦2,500` selected by default, plus a single "Pay" button. Pressing "Pay"
 * opens {@link PledgeConfirmDialog} ("Confirm your pledge" → "Confirm pledge"
 * → "Contribution confirmed").
 *
 * The component can be uncontrolled (`defaultValue`) or controlled (`value` +
 * `onValueChange`). When a pledge is confirmed it calls
 * `onContributionConfirmed`, which is how the Discover deck advances to the next
 * request ("2 of 12") — the deck owns that state, not this component.
 */

const chipBase =
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold tabular-nums transition-[filter,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

/** Selected chip: brand gradient fill, same as the primary CTA. */
const chipSelected = "bg-cta-gradient text-primary-foreground shadow-md";

/** Unselected chip: neutral, keeps AA contrast in light and dark mode. */
const chipIdle =
  "border border-border bg-background text-foreground hover:bg-muted";

export interface PledgeChipsProps {
  /** Overrides the preset amounts (defaults to ₦1,000 / ₦2,500 / ₦5,000). */
  amounts?: readonly number[];
  /** Controlled selection — pair with `onValueChange`. */
  value?: number;
  /** Initial selection when uncontrolled. Defaults to ₦2,500. */
  defaultValue?: number;
  /** Fired whenever the donor picks a different chip. */
  onValueChange?: (amount: number) => void;
  /** Fired when "Pay" is pressed, before the confirmation dialog opens. */
  onPay?: (amount: number) => void;
  /** Fired after the simulated payment is confirmed (deck advance hook). */
  onContributionConfirmed?: (contribution: Contribution) => void;
  /** Verified request the pledge belongs to (shown on the receipt). */
  recipientId?: string;
  /** Display name of the recipient. */
  recipientName?: string;
  /** Utility provider the bill belongs to. */
  biller?: string;
  /** Utility account number, when known. */
  accountNumber?: string;
  /** Disables the chips and the Pay button (e.g. while the deck animates). */
  disabled?: boolean;
  /** Group label rendered above the chips. */
  label?: string;
  className?: string;
}

export function PledgeChips({
  amounts,
  value,
  defaultValue = DEFAULT_PLEDGE_AMOUNT,
  onValueChange,
  onPay,
  onContributionConfirmed,
  recipientId,
  recipientName,
  biller,
  accountNumber,
  disabled = false,
  label = "Pledge amount",
  className,
}: PledgeChipsProps) {
  const presetAmounts = useMemo<readonly number[]>(() => {
    const candidates: readonly number[] =
      amounts && amounts.length > 0 ? amounts : PRESET_PLEDGE_AMOUNTS;

    const normalized = candidates.map((amount) =>
      normalizePledgeAmount(amount),
    );

    // De-duplicate defensively so a malformed seed can never render two chips
    // that select the same value.
    return Array.from(new Set(normalized.filter((amount) => amount > 0)));
  }, [amounts]);

  const isControlled = typeof value === "number" && Number.isFinite(value);
  const [internalAmount, setInternalAmount] = useState<number>(() =>
    normalizePledgeAmount(defaultValue),
  );

  const selectedAmount = isControlled
    ? normalizePledgeAmount(value)
    : internalAmount;

  const [dialogOpen, setDialogOpen] = useState(false);

  // Frozen at the moment "Pay" is pressed so a chip tap behind the modal can
  // never change the amount the donor is confirming.
  const [pendingAmount, setPendingAmount] = useState<number>(selectedAmount);

  const handleSelect = useCallback(
    (amount: number) => {
      if (disabled) return;

      if (!isControlled) setInternalAmount(amount);
      onValueChange?.(amount);
    },
    [disabled, isControlled, onValueChange],
  );

  const handlePay = useCallback(() => {
    if (disabled) return;

    setPendingAmount(selectedAmount);
    onPay?.(selectedAmount);
    setDialogOpen(true);
  }, [disabled, onPay, selectedAmount]);

  const handleDismiss = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleConfirmed = useCallback(
    (contribution: Contribution) => {
      onContributionConfirmed?.(contribution);
    },
    [onContributionConfirmed],
  );

  return (
    <div className={className}>
      <p className={typography.caption}>{label}</p>

      <div
        role="group"
        aria-label={label}
        className="mt-2 flex flex-wrap items-center gap-2"
      >
        {presetAmounts.map((amount) => {
          const isSelected = amount === selectedAmount;

          return (
            <button
              key={amount}
              type="button"
              aria-pressed={isSelected}
              disabled={disabled}
              onClick={() => handleSelect(amount)}
              className={`${chipBase} ${isSelected ? chipSelected : chipIdle}`}
            >
              {formatNairaAmount(amount)}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={disabled}
        className={`${buttons.primary} mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60`}
      >
        Pay
      </button>

      <p className={`mt-2 ${typography.caption}`}>
        Demo payment — no card is charged.
      </p>

      <PledgeConfirmDialog
        open={dialogOpen}
        amount={pendingAmount}
        recipientId={recipientId}
        recipientName={recipientName}
        biller={biller}
        accountNumber={accountNumber}
        onCancel={handleDismiss}
        onConfirmed={handleConfirmed}
      />
    </div>
  );
}

export default PledgeChips;
