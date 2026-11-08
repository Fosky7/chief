/**
 * Naira currency helpers.
 *
 * We format manually ("₦" + en-NG grouped digits) rather than using
 * `style: "currency"` so the output is always `₦1,234,567` across browsers
 * and never `NGN 1,234,567.00`.
 */

const groupFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  useGrouping: true,
});

/** Coerce unknown numeric-ish input to a finite, non-negative whole number. */
export function toWholeNaira(value: unknown): number {
  const n = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

/** Format an amount as Naira, e.g. 250000 -> "₦250,000". */
export function formatNaira(amount: number | string | null | undefined): string {
  return `₦${groupFormatter.format(toWholeNaira(amount))}`;
}

/** Alias kept for callers that import the "amount" name. */
export const formatNairaAmount = formatNaira;

/** Percentage (0–100, integer) of a goal that has been raised. */
export function fundedPercent(raised: number, goal: number): number {
  if (!Number.isFinite(raised) || !Number.isFinite(goal) || goal <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((raised / goal) * 100)));
}

/** Amount still needed to reach the goal (never negative). */
export function amountNeeded(raised: number, goal: number): number {
  return Math.max(0, toWholeNaira(goal) - toWholeNaira(raised));
}
