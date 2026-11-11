/**
 * Naira currency helpers.
 *
 * Formatting is done manually (instead of Intl currency style) so the output is
 * identical across browsers/locales: "₦1,000,000" — never "NGN 1,000,000.00".
 */

export const NAIRA_SYMBOL = "₦";

function toNumber(value: unknown): number {
  const n = typeof value === "string" ? Number(value.replace(/[^\d.-]/g, "")) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Format a naira amount, e.g. 1000000 -> "₦1,000,000". */
export function formatNaira(amount: number | string | null | undefined): string {
  const n = Math.round(toNumber(amount));
  const abs = Math.abs(n);
  const grouped = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "-" : ""}${NAIRA_SYMBOL}${grouped}`;
}

/** Compact naira, e.g. 1500000 -> "₦1.5m", 25000 -> "₦25k". */
export function formatNairaCompact(amount: number | string | null | undefined): string {
  const n = toNumber(amount);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const trim = (v: number) => v.toFixed(1).replace(/\.0$/, "");
  if (abs >= 1_000_000) return `${sign}${NAIRA_SYMBOL}${trim(abs / 1_000_000)}m`;
  if (abs >= 1_000) return `${sign}${NAIRA_SYMBOL}${trim(abs / 1_000)}k`;
  return formatNaira(n);
}

/** Parse user input such as "₦7,500" into a number (NaN-safe -> 0). */
export function parseNaira(input: string | number | null | undefined): number {
  return toNumber(input ?? 0);
}

/** Paystack works in kobo (1 naira = 100 kobo). */
export function nairaToKobo(naira: number): number {
  return Math.round(toNumber(naira) * 100);
}

export function koboToNaira(kobo: number): number {
  return toNumber(kobo) / 100;
}

/** Funded percentage clamped to 0–100 and rounded. */
export function fundedPercent(raised: number | string | null | undefined, goal: number | string | null | undefined): number {
  const r = toNumber(raised);
  const g = toNumber(goal);
  if (g <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((r / g) * 100)));
}
