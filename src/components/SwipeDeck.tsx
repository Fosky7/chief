import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { RecipientCard } from "@/components/RecipientCard";
import { loadDeckSessionFromCloud, saveDeckSessionToCloud } from "@/services/chiefDatabase";
import { containment, cx } from "@/config/containment";
import { buttons, gradients, typography } from "@/config/theme";
import { formatNaira, recipients } from "@/lib/recipients";

/**
 * SwipeDeck — the draggable verified-requests deck used by `/discover`.
 *
 * Containment (build step 3):
 *  - the deck viewport carries `containment.deck` (`relative w-full max-w-full
 *    overflow-hidden touch-pan-y overscroll-x-contain`), so a card dragged far
 *    left/right is clipped by the deck instead of contributing horizontal
 *    scroll width to the document;
 *  - every stacked card sits in `containment.deckCard` (`absolute inset-0
 *    min-w-0 w-full max-w-full overflow-hidden will-change-transform`), which
 *    clips its own `translate-x`/`rotate` transform and can never grow past the
 *    deck;
 *  - vertical page scrolling keeps working (`touch-pan-y`), and horizontal
 *    overscroll is contained so a swipe at the end of the deck never bounces
 *    the page sideways.
 *
 * Behaviour is unchanged: drag or use the arrow keys (← pass, → back a bill),
 * the fallback buttons do exactly the same thing, the progress label reads
 * "1 of 12" style, and progress is persisted in a small session store so
 * navigating to a recipient page and back resumes where you left off.
 */

/* -------------------------------------------------------------------------- */
/* Session store (dependency-free, localStorage-backed)                        */
/* -------------------------------------------------------------------------- */

type SwipeDirection = "pass" | "back";

interface SwipeDecision {
  readonly id: string;
  readonly direction: SwipeDirection;
  /** Amount pledged for a "back" decision (0 for a pass). */
  readonly amount: number;
}

interface DeckSession {
  readonly decisions: readonly SwipeDecision[];
}

const STORAGE_KEY = "chief.swipe-deck-session.v1";

const EMPTY_SESSION: DeckSession = { decisions: [] };

function isSwipeDecision(value: unknown): value is SwipeDecision {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    (candidate.direction === "pass" || candidate.direction === "back") &&
    typeof candidate.amount === "number" &&
    Number.isFinite(candidate.amount)
  );
}

function readSession(): DeckSession {
  if (typeof window === "undefined") return EMPTY_SESSION;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_SESSION;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_SESSION;

    const decisions = (parsed as { decisions?: unknown }).decisions;
    if (!Array.isArray(decisions)) return EMPTY_SESSION;

    return { decisions: decisions.filter(isSwipeDecision) };
  } catch {
    // A corrupted / unavailable store must never break the deck.
    return EMPTY_SESSION;
  }
}

let currentSession: DeckSession | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): DeckSession {
  if (currentSession === null) {
    currentSession = readSession();
    hydrateFromCloud();
  }
  return currentSession;
}

/** Signed-in donors: bring back swipe progress saved from another visit/device. */
function hydrateFromCloud(): void {
  if (typeof window === "undefined") return;
  void loadDeckSessionFromCloud().then((remote) => {
    const local = getSnapshot();
    if (remote && remote.decisions.length > local.decisions.length) {
      currentSession = remote;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
      } catch {
        /* memory only */
      }
      emit();
    } else if (local.decisions.length > 0) {
      void saveDeckSessionToCloud(local);
    }
  });
}

/** Stable reference for SSR / hydration — never a fresh object per call. */
function getServerSnapshot(): DeckSession {
  return EMPTY_SESSION;
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY) return;
  currentSession = readSession();
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("storage", handleStorageEvent);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

function updateSession(
  updater: (previous: DeckSession) => DeckSession,
): void {
  currentSession = updater(getSnapshot());

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSession));
    } catch {
      // Private mode / quota exceeded: keep the in-memory session only.
    }
    void saveDeckSessionToCloud(currentSession);
  }

  emit();
}

/* -------------------------------------------------------------------------- */
/* Deck configuration                                                         */
/* -------------------------------------------------------------------------- */

/** Static seed queue — guarded so a future async source can't break render. */
const REQUEST_QUEUE = Array.isArray(recipients) ? recipients : [];

/** Horizontal travel (px) that commits a swipe. */
const DRAG_THRESHOLD = 96;

/** How many cards are stacked visually behind the active one. */
const MAX_STACKED_CARDS = 3;

export interface SwipeDeckProps {
  className?: string;
}

export function SwipeDeck({ className }: SwipeDeckProps) {
  const total = REQUEST_QUEUE.length;

  const session = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const decisions = session.decisions;

  /** Cards already decided; clamped in case the queue shrank between visits. */
  const cursor = Math.min(decisions.length, total);
  const currentRecipient = cursor < total ? REQUEST_QUEUE[cursor] : undefined;

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  /** Removes the window-level listeners of an in-flight drag. */
  const detachDrag = useRef<(() => void) | null>(null);

  const pledgedTotal = useMemo(
    () =>
      decisions.reduce(
        (sum, decision) =>
          decision.direction === "back" ? sum + decision.amount : sum,
        0,
      ),
    [decisions],
  );

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                */
  /* ---------------------------------------------------------------------- */

  const decide = useCallback(
    (direction: SwipeDirection) => {
      const recipient = REQUEST_QUEUE[cursor];
      if (!recipient) return;

      const decision: SwipeDecision = {
        id: recipient.id,
        direction,
        amount: direction === "back" ? recipient.amount : 0,
      };

      updateSession((previous) => ({
        decisions: [...previous.decisions, decision],
      }));

      setDragging(false);
      setDragX(0);
    },
    [cursor],
  );

  const undo = useCallback(() => {
    updateSession((previous) =>
      previous.decisions.length === 0
        ? previous
        : { decisions: previous.decisions.slice(0, -1) },
    );
    setDragging(false);
    setDragX(0);
  }, []);

  const reset = useCallback(() => {
    updateSession(() => EMPTY_SESSION);
    setDragging(false);
    setDragX(0);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Drag (pointer events, window-scoped so the gesture can leave the card)   */
  /* ---------------------------------------------------------------------- */

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!currentRecipient) return;
      // Ignore right/middle clicks so context menus keep working.
      if (event.pointerType === "mouse" && event.button !== 0) return;

      const startX = event.clientX;

      function handleMove(moveEvent: PointerEvent): void {
        setDragX(moveEvent.clientX - startX);
      }

      function finish(): void {
        if (detachDrag.current) {
          detachDrag.current();
        }
        setDragging(false);
        setDragX(0);
      }

      function handleUp(upEvent: PointerEvent): void {
        const delta = upEvent.clientX - startX;
        finish();

        if (delta >= DRAG_THRESHOLD) {
          decide("back");
        } else if (delta <= -DRAG_THRESHOLD) {
          decide("pass");
        }
      }

      function handleCancel(): void {
        finish();
      }

      detachDrag.current?.();

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
      window.addEventListener("pointercancel", handleCancel);

      detachDrag.current = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        window.removeEventListener("pointercancel", handleCancel);
      };

      setDragging(true);
      setDragX(0);
    },
    [currentRecipient, decide],
  );

  // Never leave window listeners behind on unmount.
  useEffect(() => {
    return () => {
      detachDrag.current?.();
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Keyboard shortcuts — unchanged contract: ← pass, → back a bill          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if (!currentRecipient) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        decide("back");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        decide("pass");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentRecipient, decide]);

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  const visibleCards = useMemo(
    () => REQUEST_QUEUE.slice(cursor, cursor + MAX_STACKED_CARDS),
    [cursor],
  );

  const progressLabel =
    total === 0
      ? "No requests in the queue"
      : currentRecipient
        ? `${cursor + 1} of ${total}`
        : `${total} of ${total} reviewed`;

  const showBackHint = dragX > 0;
  const isCommitted = Math.abs(dragX) >= DRAG_THRESHOLD;

  return (
    <section
      className={cx("w-full min-w-0 max-w-full", className)}
      aria-labelledby="swipe-deck-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className={typography.eyebrow}>Swipe deck</p>
          <h2 id="swipe-deck-heading" className={typography.heading}>
            Swipe to review
          </h2>
          <span
            aria-hidden="true"
            className={cx("mt-2 block h-1 w-20 rounded-full", gradients.spectrum)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold tabular-nums text-foreground shadow-sm"
          >
            {progressLabel}
          </span>
          {pledgedTotal > 0 ? (
            <span
              className={cx(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tabular-nums text-primary-foreground shadow-sm",
                gradients.cta,
              )}
            >
              {formatNaira(pledgedTotal)} pledged
            </span>
          ) : null}
        </div>
      </div>

      {total === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className={typography.eyebrow}>Queue empty</p>
          <h3 className={cx("mt-2", typography.subheading)}>
            No verified requests right now
          </h3>
          <p className={cx("mx-auto mt-2 max-w-md", typography.body)}>
            Every open bill has been covered. Check back soon — new verified
            requests are added as providers confirm them.
          </p>
        </div>
      ) : !currentRecipient ? (
        <div className="mt-6 rounded-2xl border border-border bg-card/70 p-6 text-center shadow-sm sm:p-8">
          <p className={typography.eyebrow}>Deck complete</p>
          <h3 className={cx("mt-2", typography.subheading)}>
            You&rsquo;ve reached the end
          </h3>
          <p className={cx("mx-auto mt-2 max-w-md", typography.body)}>
            You reviewed all {total} verified request{total === 1 ? "" : "s"}
            {pledgedTotal > 0
              ? ` and backed ${formatNaira(pledgedTotal)} in total`
              : ""}
            .
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={reset} className={buttons.primary}>
              Reset deck
            </button>
            <button
              type="button"
              onClick={undo}
              disabled={decisions.length === 0}
              className={cx(
                buttons.secondary,
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              Undo last swipe
            </button>
          </div>
        </div>
      ) : (
        <div
          className={cx(
            containment.deck,
            "mt-6 h-[26rem] select-none sm:h-[28rem]",
          )}
          onPointerDown={handlePointerDown}
          role="group"
          aria-roledescription="swipe deck"
          aria-label={`Request ${cursor + 1} of ${total}: ${currentRecipient.name}`}
        >
          {visibleCards.map((recipient, offset) => {
            const isTopCard = offset === 0;

            const style: CSSProperties = isTopCard
              ? {
                  zIndex: 30,
                  transition:
                    dragging && dragX !== 0
                      ? "none"
                      : "transform 200ms ease-out",
                  transform:
                    dragging && dragX !== 0
                      ? `translate3d(${dragX}px, 0, 0) rotate(${dragX / 24}deg)`
                      : "translate3d(0, 0, 0)",
                  pointerEvents: "auto",
                }
              : {
                  zIndex: 30 - offset,
                  transition: "transform 200ms ease-out",
                  transform: `translate3d(0, ${offset * 12}px, 0) scale(${Math.max(
                    0.88,
                    1 - offset * 0.045,
                  )})`,
                  opacity: Math.max(0.4, 1 - offset * 0.2),
                  pointerEvents: "none",
                };

            return (
              <div
                key={recipient.id}
                className={containment.deckCard}
                style={style}
                aria-hidden={isTopCard ? undefined : true}
              >
                <RecipientCard
                  recipient={recipient}
                  index={cursor + offset}
                  showStoryLink={isTopCard}
                  className="h-full"
                />
              </div>
            );
          })}

          {/* Drag intent hint — decorative, never intercepts the pointer. */}
          {dragging ? (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-4 z-40 flex justify-center"
            >
              <span
                className={cx(
                  "rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity",
                  showBackHint ? "bg-step-4" : "bg-step-1",
                  isCommitted ? "opacity-100" : "opacity-60",
                )}
              >
                {showBackHint
                  ? "Release to back this bill"
                  : "Release to pass"}
              </span>
            </div>
          ) : null}
        </div>
      )}

      {/* Fallback controls — identical to the swipe gesture. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => decide("pass")}
          disabled={!currentRecipient}
          className={cx(
            buttons.secondary,
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Pass
        </button>
        <button
          type="button"
          onClick={() => decide("back")}
          disabled={!currentRecipient}
          className={cx(
            buttons.primary,
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Back this bill
        </button>
        <button
          type="button"
          onClick={undo}
          disabled={decisions.length === 0}
          className={cx(
            buttons.ghost,
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          Undo
        </button>
      </div>

      <p className={cx("mt-3", typography.caption)}>
        Drag a card left to pass or right to back it — the arrow keys (← / →) do
        exactly the same thing. Nothing is charged until you confirm.
      </p>
    </section>
  );
}

export default SwipeDeck;
