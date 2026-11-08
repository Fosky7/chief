export const NAIRA_SYMBOL = "₦";

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Formats a number as Naira with thousands separators, e.g. ₦150,000 */
export function formatNaira(value: unknown): string {
  const n = Math.round(toNumber(value));
  return `${NAIRA_SYMBOL}${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export const formatCurrency = formatNaira;

export function progressPercent(raised: unknown, needed: unknown): number {
  const r = toNumber(raised);
  const n = toNumber(needed);
  if (n <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((r / n) * 100)));
}

export default formatNaira;

// Kept: still used by other files.
export function fundedPercent(raised: number | null | undefined, goal: number | null | undefined): number {
  const r = typeof raised === "number" && Number.isFinite(raised) ? raised : 0;
  const g = typeof goal === "number" && Number.isFinite(goal) ? goal : 0;
  if (g <= 0) return r > 0 ? 100 : 0;
  const pct = Math.round((r / g) * 100);
  return Math.min(100, Math.max(0, pct));
}

/** Parse user-entered naira text ("₦12,500", "12500") into a number, or null if invalid. */
