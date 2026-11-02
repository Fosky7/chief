import { categoryAccent, surfaces, typography } from "@/config/theme";
import { formatNaira, type BillLineItem } from "@/lib/recipients";

/**
 * Provider-verified "Bill breakdown" panel.
 *
 * Renders the itemised charges behind a request, the total, and the split
 * between what donors have already pledged and what is *still needed*.
 *
 * Amounts arrive as Naira numbers and are formatted here so callers never
 * hand-format money. All colour comes from the token layer via
 * `categoryAccent()` — no raw colour values.
 */
type BillBreakdownProps = {
  /** Itemised charges; expected to add up to `total`. */
  lineItems: BillLineItem[];
  /** The full bill total in Naira. */
  total: number;
  /** The amount still outstanding in Naira (0 once the bill is settled). */
  stillNeeded: number;
  biller: string;
  category: string;
  accountNumber: string;
  /** Short due-date label, e.g. "Due 30 Apr". */
  dueLabel: string;
};

const safeAmount = (value: number): number =>
  Number.isFinite(value) && value > 0 ? value : 0;

export function BillBreakdown({
  lineItems,
  total,
  stillNeeded,
  biller,
  category,
  accountNumber,
  dueLabel,
}: BillBreakdownProps) {
  const accent = categoryAccent(category);

  // Fall back to the itemised sum if the caller passes a missing/invalid total.
  const lineItemsTotal = lineItems.reduce(
    (sum, item) => sum + safeAmount(item.amount),
    0,
  );
  const billTotal = safeAmount(total) || lineItemsTotal;

  const outstanding = Math.min(safeAmount(stillNeeded), billTotal);
  const pledged = Math.max(billTotal - outstanding, 0);
  const percentPledged =
    billTotal > 0 ? Math.min(100, Math.round((pledged / billTotal) * 100)) : 0;

  return (
    <section
      aria-labelledby="bill-breakdown-heading"
      className={`${surfaces.cardAccent} relative overflow-hidden p-5 pt-6 sm:p-6`}
    >
      {/* Category accent strip — colour is decorative, the heading carries meaning. */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 ${accent.gradient}`}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="bill-breakdown-heading"
            className="text-xl font-semibold tracking-tight"
          >
            Bill breakdown
          </h2>
          <p className={`mt-2 max-w-xl ${typography.body}`}>
            Every line below is confirmed with {biller} before the request
            reaches the deck. Your contribution goes straight to the provider.
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${accent.softSurface} ${accent.text}`}
        >
          {category}
        </span>
      </div>

      {/* Provider / account metadata */}
      <dl className="mt-5 grid gap-3 border-y border-border/70 py-4 sm:grid-cols-2">
        <div>
          <dt className={typography.caption}>Biller</dt>
          <dd className="text-sm font-semibold">{biller}</dd>
        </div>
        <div>
          <dt className={typography.caption}>Account number</dt>
          <dd className="text-sm font-semibold tabular-nums">{accountNumber}</dd>
        </div>
        <div>
          <dt className={typography.caption}>Due date</dt>
          <dd className="text-sm font-semibold">{dueLabel}</dd>
        </div>
        <div>
          <dt className={typography.caption}>Charges listed</dt>
          <dd className="text-sm font-semibold tabular-nums">
            {lineItems.length}
          </dd>
        </div>
      </dl>

      {/* Itemised charges */}
      <ul className="mt-4 divide-y divide-border/70">
        {lineItems.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex items-start justify-between gap-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.label}</p>
              {item.detail ? (
                <p className={`mt-0.5 ${typography.caption}`}>{item.detail}</p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">
              {formatNaira(safeAmount(item.amount))}
            </p>
          </li>
        ))}
      </ul>

      {/* Totals */}
      <dl className="mt-4 space-y-2 border-t border-border/70 pt-4">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm font-medium">Bill total</dt>
          <dd className="text-sm font-semibold tabular-nums">
            {formatNaira(billTotal)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className={typography.caption}>Pledged by donors</dt>
          <dd className="text-sm font-semibold tabular-nums text-muted-foreground">
            {formatNaira(pledged)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-sm font-semibold">Still needed</dt>
          <dd className={`text-base font-semibold tabular-nums ${accent.text}`}>
            {formatNaira(outstanding)}
          </dd>
        </div>
      </dl>

      <div
        role="progressbar"
        aria-label="Share of this bill already pledged"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentPledged}
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${accent.gradient}`}
          style={{ width: `${percentPledged}%` }}
        />
      </div>
      <p className={`mt-2 ${typography.caption}`}>
        {percentPledged}% of this bill already pledged by donors
      </p>
    </section>
  );
}

export default BillBreakdown;
