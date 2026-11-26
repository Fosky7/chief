/** Naira formatting helpers shared by donation and bill UIs. */

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** Formats a whole-naira amount, e.g. 2500 -> "₦2,500". */
export function formatNaira(amount: number | null | undefined): string {
  const n = typeof amount === "number" && Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₦${nf.format(n)}`;
}

/** Short form for large figures, e.g. 1500000 -> "₦1.5M". */
export function formatCompactNaira(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return formatNaira(amount);
}

/** Keeps only digits, drops leading zeros and caps the length. */
export function sanitizeNairaInput(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+/, "").slice(0, 10);
}

/** Parses user input into whole naira, or null when empty/invalid. */
export function parseNairaInput(value: string): number | null {
  const digits = sanitizeNairaInput(value);
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

/** Formats raw input with thousands separators for display. */
export function formatNairaInput(value: string): string {
  const n = parseNairaInput(value);
  return n === null ? "" : nf.format(n);
}

export const nairaToKobo = (naira: number) => Math.round(naira * 100);
export const koboToNaira = (kobo: number) => Math.round(kobo) / 100;

// Kept: still used by other files.
export function fundedPercent(
  raised: number | string | null | undefined,
  goal: number | string | null | undefined,
): number {
  const toNum = (v: number | string | null | undefined): number => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v === "string") {
      const n = Number(v.replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };
  const r = toNum(raised);
  const g = toNum(goal);
  if (!g || g <= 0) return 0;
  const pct = Math.round((r / g) * 100);
  return Math.max(0, Math.min(100, pct));
}
