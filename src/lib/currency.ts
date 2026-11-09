const groupFormatter = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatNaira(amount: number): string {
  return `₦${groupFormatter.format(Number.isFinite(amount) ? amount : 0)}`;
}

export function fundedPercent(raised: number, goal: number): number {
  if (!Number.isFinite(raised) || !Number.isFinite(goal) || goal <= 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (raised / goal) * 100)));
}
