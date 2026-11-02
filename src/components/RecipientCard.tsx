import { Link } from "@tanstack/react-router";

import { containment, cx } from "@/config/containment";
import {
  categoryAccent,
  stepGradient,
  surfaces,
  typography,
} from "@/config/theme";
import { formatNaira } from "@/lib/recipients";

/**
 * RecipientCard — the shared card primitive for a single verified request.
 *
 * Used by `/discover`'s browsable grid (inside an `<li className="flex">`) and
 * by the swipe deck, so it must obey the containment contract at every
 * breakpoint:
 *
 *  - `containment.card` (`min-w-0 max-w-full overflow-hidden`) keeps the card
 *    inside its grid cell and stops any child from leaking out;
 *  - `containment.textWrap` (`min-w-0 break-words [overflow-wrap:anywhere]`) is
 *    applied to the name, biller, category and location lines so a very long
 *    Nigerian biller name wraps instead of forcing a min-content width that
 *    would widen the page at 320px.
 *
 * No copy, Naira formatting or link destination changes: the card still reads
 * `formatNaira(amount)` / `formatNaira(stillNeeded)` and still links to
 * `/recipients/$id`.
 */

/**
 * The minimal shape this card needs. Declared structurally (rather than
 * importing the seed type) so the card can render any request object that
 * carries these fields — including a future network shape.
 */
export interface RecipientCardData {
  readonly id: string;
  readonly name: string;
  readonly biller: string;
  readonly location: string;
  readonly category: string;
  readonly amount: number;
  readonly stillNeeded: number;
  readonly dueLabel: string;
}

export interface RecipientCardProps {
  recipient: RecipientCardData;
  /** Extra classes from the consumer (e.g. `h-full` inside the swipe deck). */
  className?: string;
  /** Index used to pick the deterministic step gradient for the identity dot. */
  index?: number;
  /** Set `false` when the card sits inside a draggable deck. */
  showStoryLink?: boolean;
}

/** Shared link treatment (44px-friendly because it sits in a padded row). */
const storyLink =
  "inline-flex min-h-11 items-center gap-1 rounded-full text-sm font-semibold text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function RecipientCard({
  recipient,
  className,
  index = 0,
  showStoryLink = true,
}: RecipientCardProps) {
  // Defensive: an unknown category still resolves to a stable accent pair.
  const accent = categoryAccent(recipient.category);

  return (
    <article
      className={cx(
        surfaces.cardAccent,
        containment.card,
        "flex flex-1 flex-col gap-4 p-5 pt-6",
        className,
      )}
    >
      {/* Category accent bar — colour comes from the token layer. */}
      <span
        aria-hidden="true"
        className={cx(
          "pointer-events-none absolute inset-x-0 top-0 h-1.5",
          accent.gradient,
        )}
      />

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className={cx(
              "text-sm font-semibold tracking-tight text-foreground",
              containment.textWrap,
            )}
          >
            {recipient.name}
          </h3>
          <p
            className={cx(
              "mt-0.5 text-xs text-muted-foreground",
              containment.textWrap,
            )}
          >
            {recipient.biller}
          </p>
          <p
            className={cx(
              "mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              accent.softSurface,
              accent.text,
            )}
          >
            <span
              aria-hidden="true"
              className={cx("size-1.5 shrink-0 rounded-full", stepGradient(index))}
            />
            <span className={containment.textWrap}>{recipient.category}</span>
          </p>
        </div>

        <span
          className={cx(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm",
            accent.gradient,
          )}
        >
          Verified
        </span>
      </header>

      <div className="min-w-0">
        <p
          className={cx(
            "text-2xl font-semibold tracking-tight tabular-nums",
            accent.text,
          )}
        >
          {formatNaira(recipient.amount)}
        </p>
        <p
          className={cx(
            "mt-1 text-xs text-muted-foreground",
            containment.textWrap,
          )}
        >
          Still needed {formatNaira(recipient.stillNeeded)} · {recipient.dueLabel}
        </p>
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
        {showStoryLink ? (
          <Link
            to="/recipients/$id"
            params={{ id: recipient.id }}
            className={storyLink}
          >
            View full story
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}

        <span
          className={cx(typography.caption, containment.textWrap, "text-right")}
        >
          {recipient.location}
        </span>
      </footer>
    </article>
  );
}

export default RecipientCard;
