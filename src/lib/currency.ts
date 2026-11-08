// Currency helpers shared by the discover deck, bill detail and dashboard.
// Exports kept stable: formatNaira, fundedPercent.

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Formats an amount as Nigerian Naira, e.g. 250000 -> "₦250,000".
 * Deterministic (does not depend on the runtime's Intl locale data).
 */
export function formatNaira(
  amount: number | string | null | undefined,
  options: { decimals?: number } = {},
): string {
  const decimals = Math.max(0, Math.min(2, options.decimals ?? 0));
  const value = toNumber(amount);
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart, frac] = fixed.split(".");
  const body = groupThousands(intPart) + (frac ? `.${frac}` : "");
  return `${negative ? "-" : ""}₦${body}`;
}

/**
 * Percentage funded, clamped to 0..100 and rounded to an integer.
 * Accepts (raised, goal) or a bill-like object.
 */
export function fundedPercent(raisedOrBill: unknown, goal?: unknown): number {
  let raised: number;
  let target: number;
  if (raisedOrBill !== null && typeof raisedOrBill === "object" && goal === undefined) {
    const b = raisedOrBill as Record<string, unknown>;
    raised = toNumber(b.raised ?? b.amount_raised ?? b.raisedAmount ?? b.funded ?? 0);
    target = toNumber(b.goal ?? b.amount ?? b.target ?? b.target_amount ?? b.amount_needed ?? 0);
  } else {
    raised = toNumber(raisedOrBill);
    target = toNumber(goal);
  }
  if (target <= 0) return 0;
  const pct = Math.round((raised / target) * 100);
  return Math.max(0, Math.min(100, pct));
}
