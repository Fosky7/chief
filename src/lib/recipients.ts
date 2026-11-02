import { recipients as seedRecipients } from "@/data/recipients";
import type { BillLineItem, Recipient } from "@/types/recipient";

/**
 * Shared recipient access layer.
 *
 * The seeded dataset itself lives in `src/data/recipients.ts`; this module is
 * the single import surface every route and component uses, so the data source
 * can change later (Supabase, edge function, …) without touching the UI: —
 *   `recipients`         the full verified queue,
 *   `findRecipient(id)`  lookup used by `/recipients/$id`,
 *   `totalStillNeeded()`  aggregate used by the discover hero,
 *   `formatNaira()`      one formatting rule for every amount in the app.
 *
 * Types are re-exported so consumers can `import type { Recipient } from
 * "@/lib/recipients"` without reaching into the data layer.
 */

export type { BillLineItem, Recipient } from "@/types/recipient";

/** The full verified request queue (read-only, shared with every consumer). */
export const recipients: readonly Recipient[] = seedRecipients;

/**
 * Resolve a recipient by its URL slug.
 *
 * Returns `undefined` for unknown or archived ids so the detail route can render
 * a friendly "not found" state instead of throwing.
 */
export function findRecipient(id: string): Recipient | undefined {
  if (!id) return undefined;
  return recipients.find((recipient) => recipient.id === id);
}

/** Naira amounts are whole numbers — no decimals are ever shown. */
const nairaFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

/**
 * Format an amount in Naira, e.g. `185000` → `₦185,000`.
 * Non-finite input renders as `₦0` rather than `₦NaN`.
 */
export function formatNaira(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `₦${nairaFormatter.format(Math.round(safe))}`;
}

/** Total still outstanding across a set of requests. */
export function totalStillNeeded(list: readonly Recipient[] = recipients): number {
  return list.reduce((sum, recipient) => {
    const value = Number.isFinite(recipient.stillNeeded)
      ? recipient.stillNeeded
      : 0;
    return sum + Math.max(value, 0);
  }, 0);
}

/** Total bill value (owed) across a set of requests. */
export function totalOwed(list: readonly Recipient[] = recipients): number {
  return list.reduce((sum, recipient) => {
    const value = Number.isFinite(recipient.amount) ? recipient.amount : 0;
    return sum + Math.max(value, 0);
  }, 0);
}

/**
 * Share of a bill already covered by pledges, as a clamped 0–100 integer.
 * Used by the card's progress bar and the detail page rail.
 */
export function percentCovered(recipient: Recipient): number {
  const owed = Math.max(recipient.amount, 0);
  if (owed === 0) return 100;
  const stillNeeded = Math.min(Math.max(recipient.stillNeeded, 0), owed);
  return Math.min(100, Math.round(((owed - stillNeeded) / owed) * 100));
}

/** Convenience alias kept for callers that only need the line-item shape. */
export type RecipientLineItem = BillLineItem;
