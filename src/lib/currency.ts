/**
 * Shared currency helpers. All amounts in the app must be rendered through
 * formatNaira so display is consistent across discover, dashboard and bill detail.
 */

export type AmountInput = number | string | null | undefined;

function toNumber(value: AmountInput): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function groupThousands(intString: string): string {
  return intString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export interface FormatNairaOptions {
  /** Show compact form, e.g. ₦1.2M */
  compact?: boolean;
}

/**
 * Format an amount as Nigerian Naira, e.g. ₦12,500.
 * Deterministic (does not depend on runtime ICU locale data) and never
 * renders NaN/undefined.
 */
export function formatNaira(amount: AmountInput, options: FormatNairaOptions = {}): string {
  const n = toNumber(amount);
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  if (options.compact) {
    const units: Array<[number, string]> = [
      [1_000_000_000, "B"],
      [1_000_000, "M"],
      [1_000, "K"],
    ];
    for (const [size, suffix] of units) {
      if (abs >= size) {
        const v = abs / size;
        const str = v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, "");
        return `${sign}₦${str}${suffix}`;
      }
    }
  }

  return `${sign}₦${groupThousands(Math.round(abs).toString())}`;
}

/**
 * Percentage of goal funded, clamped to 0–100 and rounded to an integer.
 */
export function fundedPercent(raised: AmountInput, goal: AmountInput): number {
  const r = toNumber(raised);
  const g = toNumber(goal);
  if (g <= 0) return 0;
  const pct = Math.round((r / g) * 100);
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, pct));
}
