/**
 * Naira currency helpers.
 *
 * We format manually instead of relying on Intl's NGN currency style because
 * some runtimes render "NGN" instead of the "₦" symbol or add ".00" decimals.
 */

/** Group an integer string with "," thousands separators. */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Format a number as whole naira, e.g. 250000 -> "₦250,000". */
export function formatNaira(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  const safe = Number.isFinite(n) ? Math.round(n as number) : 0;
  const sign = safe < 0 ? "-" : "";
  return `${sign}₦${groupThousands(String(Math.abs(safe)))}`;
}

/** Alias used by the discover deck. */
export const formatNairaAmount = formatNaira;

/** Percentage funded, clamped to 0–100 and rounded to a whole number. */
export function fundedPercent(raised: number, goal: number): number {
  if (!Number.isFinite(raised) || !Number.isFinite(goal) || goal <= 0) return 0;
  const pct = Math.round((raised / goal) * 100);
  return Math.min(100, Math.max(0, pct));
}
