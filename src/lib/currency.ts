/**
 * Naira currency helpers.
 *
 * Formatting is implemented manually (instead of relying on Intl locale data)
 * so output is identical in every browser/runtime: "₦150,000".
 */

function toSafeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return 0;
}

/** Insert thousands separators into a non-negative integer. */
export function withThousands(value: number): string {
  const n = Math.round(Math.abs(toSafeNumber(value)));
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format an amount in naira, e.g. 150000 -> "₦150,000". */
export function formatNaira(value: number | string | null | undefined): string {
  const n = toSafeNumber(value);
  const sign = n < 0 ? "-" : "";
  return `${sign}₦${withThousands(n)}`;
}

/** Aliases kept for compatibility with components using other names. */
export const naira = formatNaira;
export const formatNGN = formatNaira;
export const formatCurrency = formatNaira;

/** Percentage funded, rounded and clamped to 0–100. */
export function fundedPercent(raised: number | string | null | undefined, goal: number | string | null | undefined): number {
  const r = toSafeNumber(raised);
  const g = toSafeNumber(goal);
  if (g <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((r / g) * 100)));
}

export const percentFunded = fundedPercent;

/** Amount still outstanding (never negative). */
export function remainingAmount(raised: number, goal: number): number {
  return Math.max(0, toSafeNumber(goal) - toSafeNumber(raised));
}
