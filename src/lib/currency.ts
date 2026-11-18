// Naira currency helpers shared across bill cards, detail pages and the
// bill submission form.

const NAIRA = "\u20A6";

/** Strip everything except digits (and one decimal point) and return a number. */
export function parseNairaInput(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** Format a value as whole naira, e.g. 250000 -> "₦250,000". */
export function formatNaira(value: number | string | null | undefined): string {
  const n = parseNairaInput(value);
  const rounded = Math.round(Math.abs(n));
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "-" : ""}${NAIRA}${formatted}`;
}

/** Format raw typed input for display inside an amount field ("" stays ""). */
export function formatNairaLive(raw: string): string {
  const digits = (raw ?? "").replace(/[^0-9]/g, "");
  if (!digits) return "";
  return formatNaira(Number(digits));
}

/** Percentage funded, clamped to 0..100 and rounded to a whole number. */
export function fundedPercent(
  raised: number | string | null | undefined,
  goal: number | string | null | undefined,
): number {
  const r = parseNairaInput(raised);
  const g = parseNairaInput(goal);
  if (!g || g <= 0) return 0;
  const pct = Math.round((r / g) * 100);
  return Math.max(0, Math.min(100, pct));
}
