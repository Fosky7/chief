import { containment, cx } from "@/config/containment";
import { typography } from "@/config/theme";
import { formatNaira } from "@/lib/recipients";

/**
 * GivingHistory — the donor's pledge ledger on `/dashboard`.
 *
 * The row layout is intentionally wide (recipient · date · amount) so it stays
 * readable on a desktop dashboard, but on a 320px phone a wide table would
 * otherwise widen the document. The list is therefore wrapped in
 * `containment.scrollX` (`w-full max-w-full overflow-x-auto
 * overscroll-x-contain`): the table scrolls inside its own box, the page never
 * does.
 *
 * All amounts go through `formatNaira()` — no formatting or copy changed here,
 * only containment. Fields are read defensively (structural, unknown-typed
 * accessors) so a slightly different contribution shape still renders instead
 * of throwing.
 */

/**
 * Minimal structural shape of a ledger entry. Everything is optional so any
 * contribution object (today's persisted store or a future network shape) is
 * assignable without tightening the caller's type.
 */
export interface GivingHistoryContribution {
  id?: string | number;
  recipientName?: string;
  amount?: number;
  createdAt?: unknown;
  status?: unknown;
}

export interface GivingHistoryProps {
  contributions: readonly GivingHistoryContribution[];
  className?: string;
}

/* -------------------------------------------------------------------------- */
/* Defensive field readers                                                    */
/* -------------------------------------------------------------------------- */

function readField(
  entry: GivingHistoryContribution,
  ...keys: readonly string[]
): unknown {
  const record = entry as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }

  return undefined;
}

function readString(
  entry: GivingHistoryContribution,
  ...keys: readonly string[]
): string | null {
  const value = readField(entry, ...keys);
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(
  entry: GivingHistoryContribution,
  ...keys: readonly string[]
): number | null {
  const value = readField(entry, ...keys);

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

const DATE_FORMATTER = (() => {
  try {
    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
})();

function toDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const fromString = new Date(value);
    return Number.isNaN(fromString.getTime()) ? null : fromString;
  }

  return null;
}

function formatEntryDate(entry: GivingHistoryContribution): string {
  const date = toDate(readField(entry, "createdAt", "date", "timestamp"));
  if (!date) return "—";
  if (!DATE_FORMATTER) return date.toISOString().slice(0, 10);

  try {
    return DATE_FORMATTER.format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function GivingHistory({ contributions, className }: GivingHistoryProps) {
  const entries = Array.isArray(contributions) ? contributions : [];

  if (entries.length === 0) {
    return (
      <section
        aria-label="Giving history"
        className={cx("w-full min-w-0 max-w-full", className)}
      >
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
          <p className={typography.eyebrow}>Nothing here yet</p>
          <p className={cx("mt-2", typography.subheading)}>
            No contributions yet
          </p>
          <p className={cx("mx-auto mt-2 max-w-md", typography.body)}>
            Your first pledge will appear here — recipient, date and the amount
            you released straight to the biller.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Giving history"
      className={cx("w-full min-w-0 max-w-full", className)}
    >
      {/*
       * The table has a comfortable minimum width, so on a narrow phone it
       * scrolls inside this box instead of pushing the dashboard wide.
       */}
      <div
        className={cx(
          containment.scrollX,
          "rounded-2xl border border-border bg-card/70 shadow-sm",
        )}
      >
        <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Your giving history — recipient, date and pledge amount
          </caption>
          <thead>
            <tr className="border-b border-border/70">
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Recipient
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Date
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Pledge
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const name =
                readString(entry, "recipientName", "name") ??
                "Verified request";
              const amount = readNumber(entry, "amount", "amountNaira", "value");
              const status = readString(entry, "status");
              const rowKey =
                typeof entry.id === "string" || typeof entry.id === "number"
                  ? `${entry.id}`
                  : `${name}-${index}`;

              return (
                <tr
                  key={rowKey}
                  className="border-b border-border/50 last:border-b-0"
                >
                  <th
                    scope="row"
                    className="px-4 py-3 text-left align-top font-medium text-foreground"
                  >
                    <span className={cx("block", containment.textWrap)}>
                      {name}
                    </span>
                    {status ? (
                      <span className="mt-1 inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {status}
                      </span>
                    ) : null}
                  </th>
                  <td
                    className={cx(
                      "px-4 py-3 align-top text-muted-foreground tabular-nums",
                      containment.textWrap,
                    )}
                  >
                    {formatEntryDate(entry)}
                  </td>
                  <td className="px-4 py-3 text-right align-top font-semibold tabular-nums text-foreground">
                    {amount === null ? "—" : formatNaira(amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default GivingHistory;
