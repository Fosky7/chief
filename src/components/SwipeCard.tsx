import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { ProgressBar } from "@/components/ProgressBar";

export type SwipeDirection = "left" | "right";

/** Minimal bill shape the card needs; compatible with sample and DB bills. */
export interface SwipeBill {
  id: string;
  title: string;
  category: string;
  city?: string | null;
  raised: number;
  goal: number;
  image?: string | null;
  imageUrl?: string | null;
}

export interface SwipeCardProps {
  bill: SwipeBill;
  /** 0 = top (interactive) card, 1+ = cards stacked behind. */
  stackIndex?: number;
  /** Called after the card has animated off-screen. */
  onSwipe?: (direction: SwipeDirection, bill: SwipeBill) => void;
  className?: string;
}

/** Horizontal distance (px) past which a release counts as a swipe. */
const SWIPE_THRESHOLD = 110;
/** Duration of the fly-off animation in ms. */
const EXIT_MS = 220;

const categoryTone: Record<string, string> = {
  Education: "bg-cat-education/15 text-cat-education",
  Health: "bg-cat-health/15 text-cat-health",
  Housing: "bg-cat-housing/15 text-cat-housing",
  Utilities: "bg-cat-utilities/15 text-cat-utilities",
};

export function SwipeCard({ bill, stackIndex = 0, onSwipe, className }: SwipeCardProps) {
  const isTop = stackIndex === 0;
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<SwipeDirection | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);

  // Reset local gesture state whenever a new bill is rendered in this slot.
  useEffect(() => {
    setDx(0);
    setDragging(false);
    setExiting(null);
    setImgFailed(false);
  }, [bill.id]);

  useEffect(() => () => {
    if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
  }, []);

  const commitSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (exiting) return;
      setExiting(direction);
      exitTimer.current = window.setTimeout(() => {
        exitTimer.current = null;
        onSwipe?.(direction, bill);
      }, EXIT_MS);
    },
    [bill, exiting, onSwipe],
  );

  function handlePointerDown(e: PointerEvent<HTMLElement>) {
    if (!isTop || exiting) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Let buttons/links inside the card behave normally.
    if ((e.target as HTMLElement).closest("button, a")) return;
    pointerId.current = e.pointerId;
    startX.current = e.clientX;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture unsupported — move events still bubble to the card */
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLElement>) {
    if (!dragging || pointerId.current !== e.pointerId) return;
    setDx(e.clientX - startX.current);
  }

  function endDrag(e: PointerEvent<HTMLElement>) {
    if (!dragging || pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setDragging(false);
    const finalDx = e.clientX - startX.current;
    if (finalDx <= -SWIPE_THRESHOLD) commitSwipe("left");
    else if (finalDx >= SWIPE_THRESHOLD) commitSwipe("right");
    else setDx(0);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (!isTop) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      commitSwipe("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      commitSwipe("right");
    }
  }

  const offset = exiting ? (exiting === "left" ? -1 : 1) * (typeof window !== "undefined" ? window.innerWidth : 800) : dx;
  const rotate = Math.max(-18, Math.min(18, offset / 14));
  const stackScale = 1 - Math.min(stackIndex, 3) * 0.04;
  const stackY = Math.min(stackIndex, 3) * 14;

  const transform = isTop
    ? `translate3d(${offset}px, 0, 0) rotate(${rotate}deg)`
    : `translate3d(0, ${stackY}px, 0) scale(${stackScale})`;

  const hint = Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD);
  const pct = fundedPercent(bill.raised, bill.goal);
  const imgSrc = bill.imageUrl || bill.image || null;

  return (
    <article
      aria-label={isTop ? `${bill.title}. Swipe left to skip, right to give.` : undefined}
      aria-hidden={isTop ? undefined : true}
      tabIndex={isTop ? 0 : -1}
      data-testid={isTop ? "swipe-card" : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      className={`absolute inset-0 select-none overflow-hidden rounded-3xl bg-card shadow-elegant outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
        isTop ? "ring-gradient cursor-grab active:cursor-grabbing" : "pointer-events-none"
      } ${className ?? ""}`}
      style={{
        transform,
        transition: dragging ? "none" : `transform ${EXIT_MS}ms ease-out, opacity ${EXIT_MS}ms ease-out`,
        opacity: exiting ? 0 : 1,
        zIndex: 30 - stackIndex,
        touchAction: "pan-y",
      }}
    >
      <div className="bg-brand-gradient relative aspect-[4/3] w-full overflow-hidden">
        {imgSrc && !imgFailed && (
          <img
            src={imgSrc}
            alt={bill.title}
            draggable={false}
            loading={isTop ? "eager" : "lazy"}
            decoding="async"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
        <span
          className={`absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold backdrop-blur ${
            categoryTone[bill.category] ?? "text-primary"
          }`}
        >
          {bill.category}
        </span>
        <span className="bg-brand-gradient absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-elegant">
          {pct}% funded
        </span>

        {isTop && (
          <>
            <span
              aria-hidden="true"
              className="absolute left-5 top-16 -rotate-12 rounded-xl border-2 border-destructive bg-card/80 px-3 py-1 text-lg font-bold uppercase text-destructive"
              style={{ opacity: dx < 0 ? hint : 0 }}
            >
              Skip
            </span>
            <span
              aria-hidden="true"
              className="absolute right-5 top-16 rotate-12 rounded-xl border-2 border-success bg-card/80 px-3 py-1 text-lg font-bold uppercase text-success"
              style={{ opacity: dx > 0 ? hint : 0 }}
            >
              Give
            </span>
          </>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div>
          {bill.city && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{bill.city}</p>
          )}
          <h2
            data-testid={isTop ? "swipe-card-title" : undefined}
            className="mt-1 line-clamp-2 break-words text-xl font-semibold leading-snug text-foreground"
          >
            {bill.title}
          </h2>
        </div>

        <ProgressBar value={bill.raised} goal={bill.goal} label={`${bill.title} funding progress`} />

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needed</dt>
            <dd data-testid={isTop ? "swipe-card-needed" : undefined} className="mt-0.5 font-semibold text-foreground">
              {formatNaira(bill.goal)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raised</dt>
            <dd data-testid={isTop ? "swipe-card-raised" : undefined} className="mt-0.5 font-semibold text-foreground">
              {formatNaira(bill.raised)}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default SwipeCard;
