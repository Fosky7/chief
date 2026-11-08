/**
 * Naira currency helpers.
 * We format manually (instead of Intl currency style) so output is stable
 * across runtimes: some environments render "NGN" instead of "₦" or add decimals.
 */
const groupFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/** Formats a number of naira, e.g. 1000000 -> "₦1,000,000". */
export function formatNaira(amount: number): string {
  if (!Number.isFinite(amount)) return "₦0";
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}₦${groupFormatter.format(Math.abs(rounded))}`;
}

/** Formats kobo (Paystack's minor unit) as naira. */
export function formatKobo(kobo: number): string {
  return formatNaira(kobo / 100);
}

/** Percentage funded, clamped 0..100. */
export function fundedPercent(raised: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}
