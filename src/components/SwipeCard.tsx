import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "@tanstack/react-router";
import { ProgressBar } from "@/components/ProgressBar";
import { formatNaira, fundedPercent } from "@/lib/currency";

/** Direction a card was thrown in. */
export type SwipeDirection = "left" | "right";

/**
 * Minimal structural shape the card renders. `BillDetail` (and therefore every
 * approved-bill row from the feed) satisfies this without adaptation.
 */
export type SwipeCardBill = {
  id: string;
  title: string;
  category?: string;
  city?: string;
  summary?: string;
  imageUrl?: string;
  /** Amount still needed to fully fund the bill, in whole Naira. */
  goal: number;
  /** Amount already raised, in whole Naira. */
  raised: number;
  donorCount?: number | null;
};

export type SwipeCardProps = {
  bill: SwipeCardBill;
  /** Fired once the card is dragged (or keyed) past the swipe threshold. */
  onSwipe?: (direction: SwipeDirection) => void;
  /** When false the card renders as a static preview (no dragging). */
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Horizontal travel (px) that commits a swipe. */
const SWIPE_THRESHOLD = 96;
/** Ignore sub-pixel jitter so a click still counts as a click. */
const DRAG_SLOP = 6;
const MAX_ROTATION = 12;

export function SwipeCard({
  bill,
  onSwipe,
  interactive = true,
  className = "",
  style,
}: SwipeCardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const pointerIdRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const movedRef = useRef(false);

  const percent = fundedPercent(bill.raised, bill.goal);
  const rotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, dragX / 14));
  const skipOpacity = Math.min(1, Math.max(0, -dragX / SWIPE_THRESHOLD));
  const giveOpacity = Math.min(1, Math.max(0, dragX / SWIPE_THRESHOLD));

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (!interactive) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    movedRef.current = false;
    setDragging(true);
    setDragX(0);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort (unsupported in a few embedded browsers).
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!dragging || pointerIdRef.current !== event.pointerId) return;

    const delta = event.clientX - startXRef.current;
    if (Math.abs(delta) > DRAG_SLOP) movedRef.current = true;
    setDragX(delta);
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    if (!dragging || pointerIdRef.current !== event.pointerId) return;

    const delta = event.clientX - startXRef.current;
    pointerIdRef.current = null;
    setDragging(false);
    setDragX(0);

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Nothing to release.
    }

    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      onSwipe?.(delta < 0 ? "left" : "right");
    }
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (!interactive || !onSwipe) return;

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      onSwipe("left");
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      onSwipe("right");
    }
  }

  /** A drag must never be mistaken for a click on the bill title link. */
  function handleTitleClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (!movedRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    movedRef.current = false;
  }

  const transform = `translate3d(${dragX}px, 0, 0) rotate(${rotation}deg)`;

  return (
    <article
      data-testid="swipe-card"
      data-bill-id={bill.id}
      aria-label={`${bill.title}. ${formatNaira(bill.goal)} needed, ${formatNaira(
        bill.raised,
      )} raised.`}
      tabIndex={interactive ? 0 : -1}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      className={`glass shadow-elegant relative select-none overflow-hidden rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${className}`}
      style={{
        ...style,
        transform,
        transition: dragging ? "none" : "transform 220ms ease-out",
        touchAction: "pan-y",
        cursor: interactive ? (dragging ? "grabbing" : "grab") : "default",
      }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {bill.imageUrl ? (
          <img
            data-testid="swipe-card-photo"
            src={bill.imageUrl}
            alt={bill.title}
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            data-testid="swipe-card-photo"
            role="img"
            aria-label={bill.title}
            className="bg-brand-gradient h-full w-full"
          />
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent"
        />

        {bill.category && (
          <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
            {bill.category}
          </span>
        )}

        {bill.city && (
          <span className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-wider text-white/90">
            {bill.city}
          </span>
        )}

        {/* Swipe affordances: revealed as the card is dragged. */}
        <span
          aria-hidden="true"
          style={{ opacity: skipOpacity }}
          className="absolute right-4 top-4 rounded-xl border-2 border-destructive px-3 py-1 text-sm font-bold uppercase tracking-wider text-destructive"
        >
          Skip
        </span>
        <span
          aria-hidden="true"
          style={{ opacity: giveOpacity }}
          className="absolute left-4 top-4 rounded-xl border-2 border-success px-3 py-1 text-sm font-bold uppercase tracking-wider text-success"
        >
          Give
        </span>
      </div>

      <div className="p-5">
        <h2
          data-testid="swipe-card-title"
          className="font-display text-xl font-semibold leading-snug text-foreground"
        >
          <Link
            to={"/bills/$id" as string}
            params={{ id: bill.id } as never}
            onClick={handleTitleClick}
            className="underline-offset-4 transition hover:underline"
          >
            {bill.title}
          </Link>
        </h2>

        {bill.summary && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {bill.summary}
          </p>
        )}

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/60 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Needed
            </dt>
            <dd
              data-testid="swipe-card-needed"
              className="mt-0.5 font-display text-lg font-semibold text-foreground"
            >
              {formatNaira(bill.goal)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Raised
            </dt>
            <dd
              data-testid="swipe-card-raised"
              className="mt-0.5 font-display text-lg font-semibold text-foreground"
            >
              {formatNaira(bill.raised)}
            </dd>
          </div>
        </dl>

        <div data-testid="swipe-card-progress" className="mt-4">
          <ProgressBar
            value={bill.raised}
            goal={bill.goal}
            size="lg"
            label={`${bill.title} funding progress`}
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{percent}% funded</span>
            {typeof bill.donorCount === "number" && bill.donorCount > 0 && (
              <span>
                {bill.donorCount} {bill.donorCount === 1 ? "donor" : "donors"}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default SwipeCard;
