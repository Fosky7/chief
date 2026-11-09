/**
 * Naira currency helpers.
 *
 * We format manually ("₦" + grouped integer) instead of relying on
 * Intl's NGN currency style, because some runtimes render "NGN" or add
 * ".00" for the en-NG locale. This keeps output stable: ₦250,000.
 */

/** Shared thousands-separator formatter (no decimals). */
export const groupFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  useGrouping: true,
});

function toFiniteNumber(value: unknown): number {
  const n = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Format a number with thousands separators, e.g. 1000000 -> "1,000,000". */
export function formatNumber(value: number | string | null | undefined): string {
  return groupFormatter.format(Math.round(toFiniteNumber(value)));
}

/** Format an amount as naira, e.g. 250000 -> "₦250,000". */
export function formatNaira(value: number | string | null | undefined): string {
  const n = Math.round(toFiniteNumber(value));
  const sign = n < 0 ? "-" : "";
  return `${sign}₦${groupFormatter.format(Math.abs(n))}`;
}

/** Parse a naira string ("₦12,500") back to a number. */
export function parseNaira(value: string): number {
  return toFiniteNumber(value);
}

/** Whole-number percent funded, clamped to 0–100. */
export function fundedPercent(raised: number, goal: number): number {
  const r = toFiniteNumber(raised);
  const g = toFiniteNumber(goal);
  if (g <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((r / g) * 100)));
}
