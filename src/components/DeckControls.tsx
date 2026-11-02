import { buttons, typography } from "@/config/theme";

/**
 * DeckControls — Module 5 fallback controls for the swipe deck.
 *
 * The deck is fully usable with a mouse, a finger or a keyboard, but a set of
 * explicit buttons keeps it accessible for anyone who cannot drag (screen
 * reader users, keyboard-only users, motor-impaired users). The buttons are
 * the canonical fallback path, so they are always rendered — the deck simply
 * disables them when the queue is exhausted.
 *
 * Copy note: the surrounding prose deliberately avoids the words on the
 * buttons so the accessible name of each control stays unambiguous.
 */

/** Small keyboard hint chip. */
const keycap =
  "inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground";

export interface DeckControlsProps {
  /** Advance the deck without pledging (left swipe). */
  onSkip: () => void;
  /** Pledge the current request and advance (right swipe). */
  onPledge: () => void;
  /** Restore the previous card (single level of undo). */
  onUndo: () => void;
  /** True when there is no current card left to act on. */
  disabled?: boolean;
  /** Requests still in the queue, shown as a helper line. */
  remaining?: number;
  /** Total requests in the session deck. */
  total?: number;
}

export function DeckControls({
  onSkip,
  onPledge,
  onUndo,
  disabled = false,
  remaining,
  total,
}: DeckControlsProps) {
  const showQueueCount =
    typeof remaining === "number" && typeof total === "number" && total > 0;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className={`${buttons.secondary} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Skip
        </button>

        <button
          type="button"
          onClick={onPledge}
          disabled={disabled}
          className={`${buttons.primary} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Pledge
        </button>

        <button type="button" onClick={onUndo} className={buttons.secondary}>
          Undo
        </button>

        {showQueueCount ? (
          <span className={`${typography.caption} ml-auto tabular-nums`}>
            {remaining} left in the queue
          </span>
        ) : null}
      </div>

      <p className={`${typography.caption} flex flex-wrap items-center gap-2`}>
        <span className={keycap} aria-hidden="true">
          ←
        </span>
        <span>drag or press left to pass</span>
        <span className={`${keycap} ml-1`} aria-hidden="true">
          →
        </span>
        <span>drag or press right to back a request</span>
      </p>
    </div>
  );
}

export default DeckControls;
