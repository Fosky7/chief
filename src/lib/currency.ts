/**
 * Naira (₦) formatting helpers.
 *
 * Amounts across Chief are always rendered with the Naira symbol and grouped
 * thousands separators (e.g. `₦1,250,000`) so donors can read figures at a
 * glance. Formatting is done manually rather than relying on ICU currency
 * output because the `₦` glyph and grouping are not guaranteed across every
 * browser/locale build.
 */

export const NGN_SYMBOL = "₦";

/** Coerces anything (string, number, null) into a finite number. */
export function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    if (cleaned.length === 0) return fallback;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

const GROUPING_PATTERN = /\B(?=(\d{3})+(?!\d))/g;

/** Inserts thousands separators into a string of digits: `1250000` → `1,250,000`. */
export function groupDigits(digits: string): string {
  return digits.replace(GROUPING_PATTERN, ",");
}

export type GroupFormatter = {
  (value: number | string | null | undefined): string;
  format(value: number | string | null | undefined): string;
};

function groupOnly(value: number | string | null | undefined): string {
  const amount = toFiniteNumber(value);
  const [whole] = Math.abs(amount).toFixed(0).split(".");
  return `${amount < 0 ? "-" : ""}${groupDigits(whole ?? "0")}`;
}

/**
 * Groups a number with thousands separators (no currency symbol).
 * Exported both as a callable and as an object with a `format` method so both
 * `groupFormatter(1250000)` and `groupFormatter.format(1250000)` work.
 */
export const groupFormatter: GroupFormatter = Object.assign(
  (value: number | string | null | undefined) => groupOnly(value),
  { format: (value: number | string | null | undefined) => groupOnly(value) },
);

export type FormatNairaOptions = {
  /** Number of decimal places to show (0–2). Defaults to 0 for whole Naira. */
  decimals?: number;
  /** When true (default) the `₦` symbol is included. */
  withSymbol?: boolean;
};

/**
 * Formats an amount of Naira: `formatNaira(1250000)` → `₦1,250,000`.
 * Missing / invalid input is rendered as `₦0` rather than throwing.
 */
export function formatNaira(
  amount: number | string | null | undefined,
  options: FormatNairaOptions = {},
): string {
  const decimals = Math.max(0, Math.min(2, options.decimals ?? 0));
  const withSymbol = options.withSymbol ?? true;
  const value = toFiniteNumber(amount);
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole, fraction] = fixed.split(".");

  const grouped = groupDigits(whole ?? "0");
  const suffix = fraction ? `.${fraction}` : "";

  return `${negative ? "-" : ""}${withSymbol ? NGN_SYMBOL : ""}${grouped}${suffix}`;
}

/** Backwards-compatible alias used by some screens. */
export const formatAmount = formatNaira;

/** Compact display for tight spaces: `₦1.3m`, `₦250k`, `₦980`. */
export function formatCompactNaira(amount: number | string | null | undefined): string {
  const value = toFiniteNumber(amount);
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 1_000_000) {
    const millions = absolute / 1_000_000;
    const rounded = millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10;
    return `${sign}${NGN_SYMBOL}${rounded}m`;
  }
  if (absolute >= 1_000) {
    return `${sign}${NGN_SYMBOL}${Math.round(absolute / 1_000)}k`;
  }
  return `${sign}${NGN_SYMBOL}${Math.round(absolute)}`;
}

/** Clamped 0–100 funding percentage for progress bars and labels. */
export function fundedPercent(
  raised: number | string | null | undefined,
  goal: number | string | null | undefined,
): number {
  const raisedValue = toFiniteNumber(raised);
  const goalValue = toFiniteNumber(goal);
  if (goalValue <= 0) return 0;
  const percent = Math.round((raisedValue / goalValue) * 100);
  return Math.min(100, Math.max(0, percent));
}

/** Ratio in the 0–1 range, handy for `<ProgressBar />` style components. */
export function progressRatio(
  raised: number | string | null | undefined,
  goal: number | string | null | undefined,
): number {
  const raisedValue = toFiniteNumber(raised);
  const goalValue = toFiniteNumber(goal);
  if (goalValue <= 0) return 0;
  return Math.min(1, Math.max(0, raisedValue / goalValue));
}

/** How much is still needed to fully fund a bill (never negative). */
export function remainingAmount(
  goal: number | string | null | undefined,
  raised: number | string | null | undefined,
): number {
  return Math.max(0, toFiniteNumber(goal) - toFiniteNumber(raised));
}
