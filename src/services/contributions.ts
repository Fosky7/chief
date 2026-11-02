/**
 * Contributions service (Module 7 — simulated pledge confirmation).
 *
 * The donor picks one of three preset pledge amounts on `/discover`
 * (₦1,000 / ₦2,500 / ₦5,000, defaulting to ₦2,500), presses "Pay", confirms in
 * the dialog and the contribution is recorded.
 *
 * Everything here is deliberately self-contained and side-effect free at import
 * time: no network, no Supabase, no timers scheduled until a pledge is actually
 * confirmed. That keeps the module trivially testable and lets a later module
 * swap `confirmContribution` for a real payment intent without touching the UI.
 */

/** Preset pledge chips shown on the Discover deck. */
export const PRESET_PLEDGE_AMOUNTS = [1000, 2500, 5000] as const;

export type PresetPledgeAmount = (typeof PRESET_PLEDGE_AMOUNTS)[number];

/** Chip selected before the donor touches anything. */
export const DEFAULT_PLEDGE_AMOUNT: number = 2500;

/**
 * How long the simulated payment "takes".
 *
 * Kept at 0 so the confirmation is deterministic (and instant) in tests —
 * callers may pass an explicit `delayMs` where a perceived latency helps.
 */
export const SIMULATED_PAYMENT_DELAY_MS = 0;

/** Lifecycle of a simulated contribution. */
export type ContributionStatus = "pending" | "confirmed" | "failed";

/** A recorded (simulated) pledge from a donor towards a verified request. */
export interface Contribution {
  /** Stable id for the record. */
  id: string;
  /** Human readable receipt reference, e.g. `PAY-AMARAOKA-0001`. */
  reference: string;
  /** Verified request the pledge belongs to. */
  recipientId: string;
  /** Display name of the recipient, when known. */
  recipientName?: string;
  /** Utility provider the bill belongs to, when known. */
  biller?: string;
  /** Utility account number, when known. */
  accountNumber?: string;
  /** Amount in whole Naira. */
  amount: number;
  /** Current status — always `confirmed` once the simulated payment resolves. */
  status: ContributionStatus;
  /** ISO timestamp of when the pledge was confirmed. */
  createdAt: string;
}

/** Arguments accepted by {@link confirmContribution}. */
export interface ConfirmContributionInput {
  recipientId?: string | null;
  amount?: number | string | null;
  recipientName?: string;
  biller?: string;
  accountNumber?: string;
}

/** Optional knobs for the simulated payment. */
export interface ConfirmContributionOptions {
  /** Artificial latency in ms (defaults to {@link SIMULATED_PAYMENT_DELAY_MS}). */
  delayMs?: number;
  /** Clock override, useful in tests. */
  now?: Date;
}

/** Thrown when a contribution cannot be recorded. */
export class ContributionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContributionError";
    // Required so `instanceof` keeps working after transpilation.
    Object.setPrototypeOf(this, ContributionError.prototype);
  }
}

/* -------------------------------------------------------------------------- */
/* Formatting + normalisation helpers                                          */
/* -------------------------------------------------------------------------- */

/**
 * Thousands separator without decimals.
 *
 * We build the Naira string by hand (instead of `style: "currency"`) because
 * ICU data differs between Node/browsers and can render `NGN 1,000` or
 * `₦1,000.00`. This helper always produces exactly `₦1,000`.
 */
const groupFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/** Formats a whole-Naira amount as e.g. `₦1,000` / `₦2,500`. */
export function formatNairaAmount(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `\u20A6${groupFormatter.format(safe)}`;
}

/**
 * Coerces anything (number, numeric string, `"2,500"`, `"₦2500"`) into a whole
 * Naira amount. Invalid or non-positive input returns `fallback`.
 */
export function normalizePledgeAmount(
  value: unknown,
  fallback: number = DEFAULT_PLEDGE_AMOUNT,
): number {
  let numeric: number;

  if (typeof value === "number") {
    numeric = value;
  } else if (typeof value === "string") {
    numeric = Number(value.replace(/[^0-9.-]/g, ""));
  } else {
    numeric = Number.NaN;
  }

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }

  return Math.round(numeric);
}

/** True when `value` is one of the preset chip amounts. */
export function isPresetPledgeAmount(value: unknown): boolean {
  const amount = normalizePledgeAmount(value, -1);
  return (PRESET_PLEDGE_AMOUNTS as readonly number[]).includes(amount);
}

/**
 * Builds a receipt reference that is stable enough to show the donor and
 * unique enough for a demo, e.g. `PAY-AMARAOKA-0003`.
 */
export function createContributionReference(
  recipientId: string,
  sequenceNumber: number = 1,
): string {
  const slug =
    String(recipientId ?? "")
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 8) || "CHIEF";

  const safeSequence = Number.isFinite(sequenceNumber)
    ? Math.max(1, Math.trunc(sequenceNumber))
    : 1;

  return `PAY-${slug}-${String(safeSequence).padStart(4, "0")}`;
}

/* -------------------------------------------------------------------------- */
/* In-memory store                                                             */
/* -------------------------------------------------------------------------- */

/** Module-level ledger — resets on a full page reload, which is correct for a demo. */
const contributions: Contribution[] = [];

let sequence = 0;

function nextSequence(): number {
  sequence += 1;
  return sequence;
}

function nextId(): string {
  const cryptoRef = typeof crypto !== "undefined" ? crypto : undefined;

  if (cryptoRef && typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }

  // Fallback for older runtimes / insecure contexts.
  return `contribution-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function delay(ms: number): Promise<void> {
  if (!Number.isFinite(ms) || ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Records a simulated pledge.
 *
 * Resolves with the confirmed {@link Contribution}; rejects with a
 * {@link ContributionError} when the input is not usable (missing request or a
 * non-positive amount), so callers can surface a friendly message.
 */
export async function confirmContribution(
  input: ConfirmContributionInput,
  options: ConfirmContributionOptions = {},
): Promise<Contribution> {
  const recipientId = String(input?.recipientId ?? "").trim();

  if (!recipientId) {
    throw new ContributionError(
      "We could not tell which verified request this pledge belongs to.",
    );
  }

  const amount = normalizePledgeAmount(input?.amount, 0);

  if (amount <= 0) {
    throw new ContributionError("Choose a pledge amount greater than zero.");
  }

  const delayMs = options.delayMs ?? SIMULATED_PAYMENT_DELAY_MS;

  // Simulated gateway round-trip.
  await delay(delayMs);

  const sequenceNumber = nextSequence();
  const createdAt = (options.now ?? new Date()).toISOString();

  const contribution: Contribution = {
    id: nextId(),
    reference: createContributionReference(recipientId, sequenceNumber),
    recipientId,
    recipientName: input.recipientName,
    biller: input.biller,
    accountNumber: input.accountNumber,
    amount,
    status: "confirmed",
    createdAt,
  };

  contributions.unshift(contribution);

  return contribution;
}

/** All recorded contributions, newest first. */
export function listContributions(): readonly Contribution[] {
  return contributions;
}

/** Contributions for a single verified request. */
export function getContributionsForRecipient(
  recipientId: string,
): readonly Contribution[] {
  const id = String(recipientId ?? "").trim();

  if (!id) return [];

  return contributions.filter((entry) => entry.recipientId === id);
}

/** Total pledged (in whole Naira) towards a single verified request. */
export function totalPledgedForRecipient(recipientId: string): number {
  return getContributionsForRecipient(recipientId).reduce(
    (sum, entry) => sum + entry.amount,
    0,
  );
}

/** Clears the ledger — used by the deck reset action and by tests. */
export function resetContributions(): void {
  contributions.length = 0;
  sequence = 0;
}
