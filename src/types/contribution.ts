// src/types/contribution.ts

/**
 * Contribution (pledge) domain types for Module 7 — preset pledge chips plus
 * the simulated payment confirmation flow.
 *
 * Everything here is currency-agnostic on purpose: amounts are stored as plain
 * Naira *major units* (e.g. `2500` means `₦2,500`) and are formatted for
 * display with the shared Naira formatter. Keeping the numbers unformatted
 * means the same value can be compared, persisted and re-rendered without ever
 * round-tripping through a locale string.
 */

/**
 * A pledge amount in Naira major units.
 *
 * `1_000` === `₦1,000`. Always a positive integer so equality checks against
 * the preset chips are exact (no floating point drift).
 */
export type PledgeAmount = number;

/**
 * Lifecycle of a single contribution.
 *
 * - `idle`      — no payment attempt has been made yet.
 * - `pending`   — the donor pressed "Pay" and the confirmation step is open.
 * - `confirmed` — the (simulated) provider settled the pledge.
 * - `failed`    — the simulated payment could not be completed.
 */
export type ContributionStatus = "idle" | "pending" | "confirmed" | "failed";

/** One preset chip rendered above the deck, e.g. `₦2,500`. */
export interface PledgePreset {
  /** Naira major units — the value submitted with the contribution. */
  readonly amount: PledgeAmount;
  /** Pre-formatted label shown inside the chip, e.g. `₦2,500`. */
  readonly label: string;
  /** Whether this chip is the default selection. Exactly one preset has it. */
  readonly isDefault: boolean;
}

/**
 * The three preset pledge chips required by the product spec.
 *
 * `₦2,500` is pre-selected so a donor can confirm a sensible pledge without
 * choosing an amount first.
 */
export const PRESET_PLEDGE_AMOUNTS = [1000, 2500, 5000] as const satisfies readonly PledgeAmount[];

/** Amount selected when the deck first renders. */
export const DEFAULT_PLEDGE_AMOUNT: PledgeAmount = 2500;

/** Formatted labels keyed by preset amount, shared by the chips and the dialog. */
export const PRESET_PLEDGE_LABELS: Readonly<Record<PledgeAmount, string>> = {
  1000: "₦1,000",
  2500: "₦2,500",
  5000: "₦5,000",
} as const;

/** The preset chips as structured data, ready to `map` over. */
export const PLEDGE_PRESETS: readonly PledgePreset[] = PRESET_PLEDGE_AMOUNTS.map(
  (amount) => ({
    amount,
    label: PRESET_PLEDGE_LABELS[amount],
    isDefault: amount === DEFAULT_PLEDGE_AMOUNT,
  }),
);

/**
 * True when `value` is one of the supported preset amounts.
 *
 * Used to keep the chip group controlled: an unknown amount can never become
 * the active pledge.
 */
export function isPresetPledgeAmount(value: unknown): value is PledgeAmount {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    (PRESET_PLEDGE_AMOUNTS as readonly number[]).includes(value)
  );
}

/** Narrowing helper for the contribution status union. */
export function isContributionStatus(value: unknown): value is ContributionStatus {
  return (
    value === "idle" ||
    value === "pending" ||
    value === "confirmed" ||
    value === "failed"
  );
}

/**
 * The in-flight pledge for the card currently on top of the deck.
 * Created when a donor picks a chip; cleared/finalised on confirm.
 */
export interface ContributionDraft {
  /** Recipient (`/recipients/$id`) the pledge is for. */
  readonly recipientId: string;
  /** Naira major units — must be a preset amount. */
  readonly amount: PledgeAmount;
  /** Display name of the biller, for the confirmation copy. */
  readonly biller?: string;
  /** Display name of the recipient, for the confirmation copy. */
  readonly recipientName?: string;
  /** Current step of the simulated payment. */
  readonly status: ContributionStatus;
}

/**
 * A settled contribution, returned by the simulated payment service and
 * rendered in the "Contribution confirmed" panel.
 */
export interface ContributionReceipt {
  /** Stable id for React keys and de-duplication. */
  readonly id: string;
  /** Human-readable payment reference, e.g. `PAY-AB12CD34`. */
  readonly reference: string;
  /** Recipient the pledge was made to. */
  readonly recipientId: string;
  /** Amount actually paid, in Naira major units. */
  readonly amount: PledgeAmount;
  /** Terminal state — `confirmed` on success, `failed` otherwise. */
  readonly status: Extract<ContributionStatus, "confirmed" | "failed">;
  /** ISO-8601 timestamp of when the pledge was settled. */
  readonly createdAt: string;
  /** Copy shown to the donor, e.g. `Contribution confirmed`. */
  readonly message: string;
  /** Optional error detail when `status` is `failed`. */
  readonly error?: string;
}

/**
 * Alias kept intentionally short: a contribution is the *record* produced by a
 * confirmed pledge, which is what pages and the dashboard consume.
 */
export type Contribution = ContributionReceipt;

/** Result wrapper returned by the simulated payment service. */
export type ContributionResult =
  | { ok: true; contribution: ContributionReceipt }
  | { ok: false; error: string };

/** Copy used across the pledge UI so wording stays identical everywhere. */
export const CONTRIBUTION_COPY = {
  /** Dialog heading shown after pressing "Pay". */
  confirmTitle: "Confirm your pledge",
  /** Primary action inside the confirmation dialog. */
  confirmAction: "Confirm pledge",
  /** Cancel action inside the confirmation dialog. */
  cancelAction: "Cancel",
  /** Success message shown once the pledge settles. */
  confirmedMessage: "Contribution confirmed",
  /** Failure message for the simulated payment. */
  failedMessage: "We couldn't confirm that pledge. Please try again.",
} as const;
