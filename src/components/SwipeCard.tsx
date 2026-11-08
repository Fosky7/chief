import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { formatNaira, fundedPercent } from "@/lib/currency";
import type { ApprovedBill } from "@/hooks/useApprovedBills";

interface SwipeCardProps {
  bill: ApprovedBill;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  /** Set by the parent while the card animates off-screen. */
  exiting?: "left" | "right" | null;
}

/** Horizontal distance (px) a drag must exceed to count as a swipe. */
const SWIPE_THRESHOLD = 110;

export function SwipeCard({ bill, onSwipeLeft, onSwipeRight, exiting = null }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const startX = useRef<number | null>(null);

  const pct = fundedPercent(bill.raised, bill.goal);
  const needed = Math.max(bill.needed ?? bill.goal - bill.raised, 0);

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (exiting) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startX.current = e.clientX;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer capture is best-effort.
    }
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  }

  function finishDrag() {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    const final = dx;
    if (final <= -SWIPE_THRESHOLD) {
      // Keep the offset; parent sets `exiting` and swaps the card.
      onSwipeLeft();
    } else if (final >= SWIPE_THRESHOLD) {
      setDx(0);
      onSwipeRight();
    } else {
      setDx(0);
    }
  }

  const transform = exiting
    ? `translateX(${exiting === "left" ? "-150%" : "150%"}) rotate(${exiting === "left" ? -18 : 18}deg)`
    : `translateX(${dx}px) rotate(${dx / 18}deg)`;

  const hint = dx <= -SWIPE_THRESHOLD / 2 ? "skip" : dx >= SWIPE_THRESHOLD / 2 ? "give" : null;

  return (
    <article
      data-testid="swipe-card"
      aria-label={`Bill: ${bill.title}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      className={`ring-gradient shadow-elegant absolute inset-0 flex cursor-grab touch-none select-none flex-col overflow-hidden rounded-3xl bg-card text-card-foreground active:cursor-grabbing ${
        dragging ? "" : "transition-[transform,opacity] duration-300 ease-out"
      } ${exiting ? "opacity-0" : "opacity-100"}`}
      style={{ transform }}
    >
      <div className="bg-brand-gradient relative aspect-[4/3] w-full shrink-0 overflow-hidden">
        {bill.imageUrl && !imgFailed && (
          <img
            src={bill.imageUrl}
            alt={bill.title}
            draggable={false}
            onError={() => setImgFailed(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
          {bill.category}
        </span>
        {hint === "skip" && (
          <span
            aria-hidden="true"
            className="absolute right-4 top-4 rotate-12 rounded-xl border-2 border-destructive bg-card/90 px-3 py-1 text-sm font-bold uppercase text-destructive"
          >
            Skip
          </span>
        )}
        {hint === "give" && (
          <span
            aria-hidden="true"
            className="absolute left-4 top-12 -rotate-12 rounded-xl border-2 border-success bg-card/90 px-3 py-1 text-sm font-bold uppercase text-success"
          >
            Give
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{bill.city}</p>
        <h2 className="line-clamp-2 text-xl font-semibold leading-snug text-foreground">{bill.title}</h2>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/60 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needed</dt>
            <dd className="mt-0.5 font-display text-lg font-semibold text-foreground" data-testid="swipe-card-needed">
              {formatNaira(needed)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raised</dt>
            <dd className="mt-0.5 font-display text-lg font-semibold text-foreground" data-testid="swipe-card-raised">
              {formatNaira(bill.raised)}
            </dd>
          </div>
        </dl>

        <div className="mt-auto">
          <ProgressBar value={bill.raised} goal={bill.goal} label={`${bill.title} funding progress`} />
          <p className="mt-2 text-sm text-muted-foreground">
            {pct}% of {formatNaira(bill.goal)} funded
          </p>
        </div>
      </div>
    </article>
  );
}

export default SwipeCard;
