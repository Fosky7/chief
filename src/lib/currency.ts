export const groupFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatNaira(amount: number | string | null | undefined): string {
  return `₦${groupFormatter.format(Math.round(toNumber(amount)))}`;
}

export function fundedPercent(
  raised: number | string | null | undefined,
  goal: number | string | null | undefined,
): number {
  const g = toNumber(goal);
  if (g <= 0) return 0;
  const pct = Math.round((toNumber(raised) / g) * 100);
  return Math.min(100, Math.max(0, pct));
}
