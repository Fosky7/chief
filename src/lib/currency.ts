/**
 * Nigerian naira formatting helpers.
 *
 * Money reaches the UI from several places: Supabase numeric columns arrive as
 * strings ("250000.00"), sample fixtures use numbers, and some legacy rows use
 * an empty string. Every helper therefore accepts loose input and degrades to a
 * safe default instead of rendering "NaN" into the deck.
 */

/** Currency symbol used everywhere in the UI. */
export const NAIRA_SYMBOL = '₦';

/** Coerce a number/string (including "250000.00") into a finite number. */
export function toNairaNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '').trim();
    if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Insert thousands separators into a digits-only string: "250000" -> "250,000". */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export type FormatNairaOptions = {
  /** Digits after the decimal point (0-2). Defaults to 0 for whole naira. */
  decimals?: number;
};

/**
 * Format an amount as naira with thousands separators.
 *
 *   formatNaira(250000)      -> "₦250,000"
 *   formatNaira('1250000')   -> "₦1,250,000"
 *   formatNaira(-1500)       -> "-₦1,500"
 *   formatNaira(null)        -> "₦0"
 */
export function formatNaira(
  amount: number | string | null | undefined,
  options: FormatNairaOptions = {},
): string {
  const decimals = Math.min(Math.max(Math.trunc(options.decimals ?? 0), 0), 2);
  const value = toNairaNumber(amount) ?? 0;

  // Work on the absolute value so rounding never produces "-0".
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole, fraction] = fixed.split('.');
  const grouped = groupThousands(whole ?? '0');
  const decimalPart = decimals > 0 && fraction ? `.${fraction}` : '';
  const sign = value < 0 ? '-' : '';

  return `${sign}${NAIRA_SYMBOL}${grouped}${decimalPart}`;
}

/** Same grouping as {@link formatNaira} but without the symbol: "250,000". */
export function formatNairaAmount(
  amount: number | string | null | undefined,
  options: FormatNairaOptions = {},
): string {
  return formatNaira(amount, options).split(NAIRA_SYMBOL).join('');
}

// Kept: still used by other files.
export function fundedPercent(raised: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((raised / goal) * 100)));
}
