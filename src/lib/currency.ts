/**
 * Naira currency helpers.
 *
 * Formatting is done manually (rather than via Intl locale data) so the output
 * is identical across browsers/runtimes: "₦" followed by comma-grouped digits,
 * e.g. formatNaira(1000000) === "₦1,000,000".
 */

const NAIRA = "\u20A6"; // ₦

/** Group an integer string with commas every three digits. */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Format a naira amount. Whole naira are shown without decimals; fractional
 * amounts are rounded to the nearest naira since bills are tracked in whole naira.
 */
export function formatNaira(amount: number | null | undefined): string {
  const value = typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(Math.abs(value));
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return `${sign}${NAIRA}${groupThousands(String(rounded))}`;
}

/** Percentage of goal funded, clamped to 0–100 and rounded to a whole number. */
export function fundedPercent(raised: number | null | undefined, goal: number | null | undefined): number {
  const r = typeof raised === "number" && Number.isFinite(raised) ? raised : 0;
  const g = typeof goal === "number" && Number.isFinite(goal) ? goal : 0;
  if (g <= 0) return r > 0 ? 100 : 0;
  const pct = Math.round((r / g) * 100);
  return Math.min(100, Math.max(0, pct));
}

/** Parse user-entered naira text ("₦12,500", "12500") into a number, or null if invalid. */
export function parseNaira(input: string): number | null {
  const cleaned = input.replace(/[\u20A6,\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
