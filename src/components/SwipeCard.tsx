import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "@tanstack/react-router";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { CategoryBadge } from "@/components/ui/brand";
import { ProgressBar } from "@/components/ProgressBar";
import { billNeededAmount, type ApprovedBill } from "@/hooks/useApprovedBills";

/** Which way a card was thrown. */
export type SwipeDirection = "left" | "right";

/** Horizontal drag (px) that commits the swipe when the pointer is released. */
export const SWIPE_COMMIT_DISTANCE = 110;

/** Used when a remote photo fails to load so the media box never collapses. */
const IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=70";

export interface SwipeCardProps {
  /** The deck-normalised bill rendered by this card. */
  bill: ApprovedBill;
  /** Called when the card is dragged (or ArrowLeft/ArrowRight) past the commit distance. */
  onSwiped?: (direction: SwipeDirection, bill: ApprovedBill) => void;
  /** Only the top card is draggable/keyboard operable. */
  interactive?: boolean;
  /** Marks the card as the one on top — also enables the deck test hooks. */
  isTop?: boolean;
  /** Load the photo eagerly for the top card. */
  eager?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** CategoryBadge accepts its own literal union — narrow our type to it. */
type BadgeCategory = Parameters<typeof CategoryBadge>[0]["category"];

/**
 * SwipeCard — one bill in the discovery deck.
 *
 * Renders the bill photo, title, the "Needed" / "Raised" naira amounts and a
 * funding progress bar. The top card is draggable with pointer events (mouse,
 * touch and pen): drag left to skip, drag right to help. Releasing past
 * {@link SWIPE_COMMIT_DISTANCE} notifies the deck so it can reveal the next card.
 *
 * Drag state lives entirely inside the card (a transform offset), so the parent
 * only has to swap which bill it passes in.
 */
export function SwipeCard({
  bill,
  onSwiped,
  interactive = false,
  isTop = false,
  eager = false,
  className,
  style,
}: SwipeCardProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [imageSrc, setImageSrc] = useState(bill.imageUrl);
  const startXRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);

  // A brand new bill means a brand new card: clear any leftover drag transform.
  useEffect(() => {
    setOffset(0);
    setDragging(false);
    activePointerRef.current = null;
    setImageSrc(bill.imageUrl);
  }, [bill.id, bill.imageUrl]);

  const canSwipe = interactive && typeof onSwiped === "function";

  const commit = useCallback(
    (direction: SwipeDirection) => {
      setOffset(0);
      setDragging(false);
      activePointerRef.current = null;
      onSwiped?.(direction, bill);
    },
    [bill, onSwiped],
  );

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!canSwipe) return;
    // Ignore secondary mouse buttons / right click.
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startXRef.current = event.clientX;
    activePointerRef.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!dragging || activePointerRef.current !== event.pointerId) return;
    setOffset(event.clientX - startXRef.current);
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!dragging || activePointerRef.current !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Capture may already be gone (pointercancel) — safe to ignore.
    }
    const delta = event.clientX - startXRef.current;
    if (delta <= -SWIPE_COMMIT_DISTANCE) commit("left");
    else if (delta >= SWIPE_COMMIT_DISTANCE) commit("right");
    else {
      setOffset(0);
      setDragging(false);
      activePointerRef.current = null;
    }
  }

  function handlePointerCancel() {
    setOffset(0);
    setDragging(false);
    activePointerRef.current = null;
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (!canSwipe) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      commit("left");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      commit("right");
    }
  }

  const needed = billNeededAmount(bill);
  const percent = fundedPercent(bill.raised, bill.goal);
  const dragProgress = Math.min(Math.abs(offset) / SWIPE_COMMIT_DISTANCE, 1);
  const skipHintOpacity = offset < 0 ? dragProgress : 0;
  const helpHintOpacity = offset > 0 ? dragProgress : 0;

  return (
    <article
      data-testid={isTop ? "top-bill-card" : undefined}
      data-bill-id={bill.id}
      tabIndex={canSwipe ? 0 : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={handlePointerCancel}
      onKeyDown={handleKeyDown}
      style={{
        ...style,
        touchAction: "pan-y",
        transform: `translate3d(${offset}px, 0, 0) rotate(${offset / 26}deg)`,
        transition: dragging ? "none" : "transform 220ms ease-out",
      }}
      className={[
        "glass shadow-elegant relative w-full select-none overflow-hidden rounded-3xl bg-card",
        canSwipe ? "cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-gradient">
        <img
          src={imageSrc}
          alt={bill.title}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          onError={() => setImageSrc(IMAGE_FALLBACK)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
        />

        <div className="pointer-events-none absolute left-4 top-4">
          <CategoryBadge
            category={bill.category as BadgeCategory}
            className="bg-card/90 backdrop-blur"
          />
        </div>
        <span className="bg-brand-gradient pointer-events-none absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-elegant">
          {percent}% funded
        </span>

        {/* Drag affordances — fade in as the card is thrown. */}
        <span
          aria-hidden="true"
          style={{ opacity: skipHintOpacity }}
          className="pointer-events-none absolute left-4 top-1/2 inline-flex -translate-y-1/2 rotate-[-8deg] items-center gap-1.5 rounded-full border-2 border-white/70 bg-destructive/90 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white"
        >
          Skip
        </span>
        <span
          aria-hidden="true"
          style={{ opacity: helpHintOpacity }}
          className="pointer-events-none absolute right-4 top-1/2 inline-flex -translate-y-1/2 rotate-[8deg] items-center gap-1.5 rounded-full border-2 border-white/70 bg-success/90 px-3 py-1.5 text-sm font-bold uppercase tracking-wide text-white"
        >
          Help
        </span>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {bill.city || "Nigeria"}
          </p>
          <h2
            data-testid={isTop ? "top-bill-title" : undefined}
            className="mt-1 break-words text-xl font-semibold leading-snug text-foreground sm:text-2xl"
          >
            {bill.title}
          </h2>
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/70 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Needed
            </dt>
            <dd
              data-testid={isTop ? "top-bill-needed" : undefined}
              className="mt-1 font-display text-lg font-semibold tabular-nums text-foreground"
            >
              {formatNaira(needed)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/70 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Raised
            </dt>
            <dd
              data-testid={isTop ? "top-bill-raised" : undefined}
              className="mt-1 font-display text-lg font-semibold tabular-nums text-foreground"
            >
              {formatNaira(bill.raised)}
            </dd>
          </div>
        </dl>

        <ProgressBar
          value={bill.raised}
          goal={bill.goal}
          label={`${bill.title} funding progress`}
          testId={isTop ? "top-bill-progress" : undefined}
        />

        {isTop && (
          <Link
            to="/bills/$id"
            params={{ id: bill.id }}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Read the full story <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}

export default SwipeCard;
