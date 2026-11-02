import { Link } from "@tanstack/react-router";

import {
  categoryAccent,
  gradients,
  interactive,
  surfaces,
  typography,
} from "@/config/theme";
import { formatNaira } from "@/lib/recipients";

/**
 * Minimal structural shape of a verified request as rendered by the home deck.
 *
 * The seed data in `src/lib/recipients` is a little richer than this, but the
 * card only ever reads these fields. Everything except `id`, `name`, `biller`
 * and `amount` is optional so a malformed/partial record can never crash the
 * render — it simply renders fewer meta lines.
 */
export interface RequestPreviewRecipient {
  id: string;
  name: string;
  biller: string;
  category?: string | null;
  amount?: number | null;
  stillNeeded?: number | null;
  dueLabel?: string | null;
  location?: string | null;
}

export interface RequestPreviewCardProps {
  recipient: RequestPreviewRecipient;
  /**
   * Accepted for API compatibility with the route's `map((r, i) => …)` call
   * and surfaced as a harmless `data-card-index` hook for testing. The card's
   * colour identity comes from `categoryAccent(recipient.category)`, never
   * from the position in the list.
   */
  index?: number;
}

/**
 * Format a Naira amount defensively: a non-finite value degrades to an em
 * dash rather than throwing inside `formatNaira`.
 */
function safeNaira(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";

  try {
    return formatNaira(value);
  } catch {
    return "—";
  }
}

/**
 * The "View full story" link — accent-tinted, underlined on hover and given a
 * shared focus ring so keyboard users get the same lift as pointer users.
 * The 44px minimum height keeps the tap target honest on mobile.
 */
const storyLink =
  "inline-flex min-h-[2.75rem] shrink-0 items-center gap-1 rounded-full text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline";

/**
 * A single card in the verified-requests deck.
 *
 * Visual composition (top → bottom):
 *  - `surfaces.cardRainbow` paints the rainbow hairline via a 1px gradient
 *    padding box; `surfaces.cardRainbowInner` restores the opaque card fill
 *    so the hairline reads as a border rather than a wash.
 *  - a `categoryAccent()` gradient strip across the top edge gives each
 *    category its own identity without leaving the token layer;
 *  - a spectrum identity dot + tinted chip announce the category;
 *  - the amount is rendered in the accent's `*-ink` colour with
 *    `tabular-nums` so columns of figures line up.
 *
 * Long recipient / biller / location strings are truncated (`min-w-0` +
 * `truncate`) so one awkward name can never widen the `sm:grid-cols-2
 * lg:grid-cols-3` grid and create horizontal overflow.
 *
 * The link destination (`/recipients/$id`) and its params are unchanged.
 */
export function RequestPreviewCard({
  recipient,
  index,
}: RequestPreviewCardProps) {
  const accent = categoryAccent(recipient.category);

  const name = recipient.name?.trim() || "Verified request";
  const biller = recipient.biller?.trim() || "Utility provider";
  const categoryLabel = recipient.category?.trim() || "Verified";
  const location = recipient.location?.trim() ?? "";
  const due = recipient.dueLabel?.trim() ?? "";
  const stillNeededLabel =
    typeof recipient.stillNeeded === "number" &&
    Number.isFinite(recipient.stillNeeded)
      ? `Still needed ${safeNaira(recipient.stillNeeded)}`
      : "";

  return (
    <li
      data-card-index={typeof index === "number" ? index : undefined}
      className={`${surfaces.cardRainbow} relative h-full transition-shadow hover:shadow-md`}
    >
      <div
        className={`${surfaces.cardRainbowInner} relative flex h-full flex-col gap-4 overflow-hidden p-5 pt-6`}
      >
        {/* Category accent strip along the top edge. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 ${accent.gradient}`}
        />

        {/* Header: identity + category chip + verified pill. */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              {name}
            </p>
            <p className={`mt-0.5 truncate ${typography.caption}`}>{biller}</p>

            <span
              className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${accent.softSurface} ${accent.text}`}
            >
              <span
                aria-hidden="true"
                className={`size-1.5 shrink-0 rounded-full ${gradients.spectrum}`}
              />
              <span className="truncate">{categoryLabel}</span>
            </span>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm ${accent.gradient}`}
          >
            Verified
          </span>
        </div>

        {/* Amount — accent-tinted and tabular so figures align. */}
        <div className="min-w-0">
          <p
            className={`text-2xl font-semibold tracking-tight tabular-nums ${accent.text}`}
          >
            {safeNaira(recipient.amount)}
          </p>

          {stillNeededLabel || due ? (
            <p className={`mt-1 ${typography.caption}`}>
              {stillNeededLabel}
              {stillNeededLabel && due ? " · " : null}
              {due}
            </p>
          ) : null}
        </div>

        {/* Footer: story link + location. */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-2">
          <Link
            to="/recipients/$id"
            params={{ id: recipient.id }}
            className={`${storyLink} ${interactive.focusRing}`}
          >
            View full story
            <span aria-hidden="true">→</span>
          </Link>

          {location ? (
            <span
              className={`min-w-0 truncate text-right ${typography.caption}`}
            >
              {location}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default RequestPreviewCard;
