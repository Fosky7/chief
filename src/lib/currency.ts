// Naira currency helpers shared across the app.
// formatNaira always renders "₦" followed by a whole-number amount with
// comma thousands separators, e.g. formatNaira(250000) -> "₦250,000".

const grouping = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  useGrouping: true,
});

/** Coerce unknown numeric-ish input to a finite number (0 when invalid). */
export function toAmount(value: unknown): number {
  const n = typeof value === "string" ? Number(value.replace(/[^0-9.-]/g, "")) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Format a Naira amount as "₦1,234,567" (no decimals). Negative values get a leading minus. */
export function formatNaira(amount: number | string | null | undefined): string {
  const n = Math.round(toAmount(amount));
  const sign = n < 0 ? "-" : "";
  return `${sign}₦${grouping.format(Math.abs(n))}`;
}

/** Whole-number percentage of goal reached, clamped to 0–100. */
export function fundedPercent(raised: number | string | null | undefined, goal: number | string | null | undefined): number {
  const r = toAmount(raised);
  const g = toAmount(goal);
  if (g <= 0) return 0;
  const pct = Math.round((r / g) * 100);
  return Math.min(100, Math.max(0, pct));
}

/** Amount still needed to hit the goal (never negative). */
export function remainingAmount(raised: number | string | null | undefined, goal: number | string | null | undefined): number {
  return Math.max(0, toAmount(goal) - toAmount(raised));
}
