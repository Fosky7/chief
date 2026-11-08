/**
 * Naira currency helpers.
 *
 * Formatting is done manually (rather than relying on Intl currency output)
 * so the "₦" symbol and "," thousands separators render identically across
 * browsers / ICU builds.
 */

const NAIRA = "₦";

/** Group an integer string with comma thousands separators. */
function groupThousands(intDigits: string): string {
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Coerce unknown numeric-ish input to a finite number (0 on failure). */
export function toAmount(value: unknown): number {
  const n = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Format a Naira amount, e.g. 250000 → "₦250,000".
 * Fractions are rounded to whole Naira unless `withKobo` is true.
 */
export function formatNaira(amount: number, withKobo = false): string {
  const value = Number.isFinite(amount) ? amount : 0;
  const negative = value < 0;
  const abs = Math.abs(value);
  let body: string;
  if (withKobo) {
    const [int, frac] = abs.toFixed(2).split(".");
    body = `${groupThousands(int)}.${frac}`;
  } else {
    body = groupThousands(String(Math.round(abs)));
  }
  return `${negative ? "-" : ""}${NAIRA}${body}`;
}

/** Compact Naira, e.g. 1_250_000 → "₦1.3M", 45_000 → "₦45K". */
export function formatNairaCompact(amount: number): string {
  const v = Math.abs(Number.isFinite(amount) ? amount : 0);
  const sign = amount < 0 ? "-" : "";
  if (v >= 1_000_000_000) return `${sign}${NAIRA}${trim(v / 1_000_000_000)}B`;
  if (v >= 1_000_000) return `${sign}${NAIRA}${trim(v / 1_000_000)}M`;
  if (v >= 1_000) return `${sign}${NAIRA}${trim(v / 1_000)}K`;
  return formatNaira(amount);
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

/** Kobo (Paystack minor unit) → Naira. */
export function koboToNaira(kobo: number): number {
  return toAmount(kobo) / 100;
}

/** Naira → kobo (Paystack minor unit). */
export function nairaToKobo(naira: number): number {
  return Math.round(toAmount(naira) * 100);
}

/** Percentage funded, clamped to 0–100 and rounded. */
export function fundedPercent(raised: number, goal: number): number {
  if (!Number.isFinite(goal) || goal <= 0) return 0;
  const pct = (toAmount(raised) / goal) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** Amount still needed (never negative). */
export function remainingAmount(raised: number, goal: number): number {
  return Math.max(toAmount(goal) - toAmount(raised), 0);
}
