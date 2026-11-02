/**
 * Canonical recipient (verified bill request) types.
 *
 * These types are the single contract shared by:
 *  - the seeded dataset (`src/data/recipients.ts`),
 *  - the discover card (`src/components/RecipientCard.tsx`),
 *  - the recipient detail page (`src/routes/recipients.$id.tsx`),
 *  - the bill breakdown table (`src/components/BillBreakdown.tsx`).
 *
 * The seed and the fixtures in the UI must never drift apart, so every field a
 * card or detail view renders lives here once.
 */

/**
 * A single line on a provider-verified bill.
 *
 * `label` and `description` intentionally carry the same human readable text:
 * the breakdown table renders `description`, while compact summaries render
 * `label`. Keeping both means neither consumer has to adapt the dataset.
 */
export type BillLineItem = {
  /** Short label, e.g. "March rent". */
  label: string;
  /** Same text as `label`, used by the itemised breakdown table. */
  description: string;
  /** Amount in Naira (NGN). */
  amount: number;
};

/**
 * Bill types we currently verify with providers.
 *
 * Kept as a union so new bill types must be added deliberately, but rendering
 * code always treats categories defensively (see `categoryAccent` in the theme
 * layer, which falls back to a safe accent for unknown values).
 */
export type BillType =
  | "Rent"
  | "Electricity"
  | "Water"
  | "Gas"
  | "Internet"
  | "School fees";

/**
 * A verified bill request from a neighbour.
 *
 * Amount fields are Naira integers — no decimals, matching how Nigerian
 * providers bill their customers.
 */
export type Recipient = {
  /** Stable slug used in `/recipients/$id`. */
  id: string;
  /** Recipient's display name. */
  name: string;
  /** Absolute `https://` portrait URL. */
  imageUrl: string;
  /** City / area, e.g. "Yaba, Lagos". */
  location: string;
  /** Date the provider confirmed the account, e.g. "12 March 2025". */
  verifiedOn: string;
  /** What the bill is for — surfaced as the bill type chip on the card. */
  billType: BillType | string;
  /** Accent category used for colour coding (usually equals `billType`). */
  category: string;
  /** Utility / landlord / school the money is paid to. */
  biller: string;
  /** Provider account or reference number. */
  accountNumber: string;
  /** Total amount owed on the bill, in Naira. */
  amount: number;
  /** Amount still outstanding after existing pledges, in Naira. */
  stillNeeded: number;
  /** Human readable due date, e.g. "Due 30 March 2025". */
  dueLabel: string;
  /** One-liner used in the detail hero. */
  note: string;
  /** Short paragraph shown under "Their story" on the discover card. */
  storySummary: string;
  /** Long-form story shown on the recipient detail page. */
  story: string;
  /** Itemised, provider-verified breakdown. Sums to `amount`. */
  breakdown: BillLineItem[];
};
