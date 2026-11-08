import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { ProgressBar } from "@/components/ProgressBar";

/**
 * Structural bill shape accepted by the card. Kept deliberately permissive so it
 * works with live approved bills and the sample fallback, whichever field names
 * they use for image / amounts.
 */
export interface SwipeCardBill {
  id: string;
  title: string;
  category?: string | null;
  city?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  photoUrl?: string | null;
  image_url?: string | null;
  goal?: number | null;
  needed?: number | null;
  amountNeeded?: number | null;
  amount?: number | null;
  raised?: number | null;
  amountRaised?: number | null;
  raised_amount?: number | null;
}

export interface SwipeCardProps {
  bill: SwipeCardBill;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  /** When set, the card animates off-screen in that direction. */
  exiting?: "left" | "right" | null;
}

const SWIPE_THRESHOLD = 110;
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=70";

function num(...values: Array<number | null | undefined>): number {
  for (const v of values) {
    const n = Number(v);
    if (v !== null && v !== undefined && Number.isFinite(n)) return n;
  }
  return 0;
}

export function SwipeCard({ bill, onSwipeLeft, onSwipeRight, exiting = null }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const needed = num(bill.needed, bill.goal, bill.amountNeeded, bill.amount);
  const raised = num(bill.raised, bill.amountRaised, bill.raised_amount);
  const pct = fundedPercent(raised, needed);
  const src = imgFailed
    ? FALLBACK_IMAGE
    : bill.imageUrl || bill.image || bill.photoUrl || bill.image_url || FALLBACK_IMAGE;

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (exiting) return;
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (!dragging || startX.current === null) return;
    setDx(e.clientX - startX.current);
  }

  function finish(e: ReactPointerEvent<HTMLElement>) {
    if (!dragging) return;
    setDragging(false);
    startX.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (dx <= -SWIPE_THRESHOLD) {
      onSwipeLeft();
      // Keep offset; the exiting prop carries it the rest of the way.
      return;
    }
    if (dx >= SWIPE_THRESHOLD) {
      onSwipeRight();
    }
    setDx(0);
  }

  // Compute transform: exit animation overrides drag offset.
  let translate = dx;
  if (exiting === "left") translate = -600;
  if (exiting === "right") translate = 600;
  const rotate = translate / 18;
  const transition = dragging ? "none" : "transform 250ms ease-out, opacity 250ms ease-out";
  const leftHint = Math.min(1, Math.max(0, -dx / SWIPE_THRESHOLD));
  const rightHint = Math.min(1, Math.max(0, dx / SWIPE_THRESHOLD));

  return (
    <article
      data-testid="swipe-card"
      aria-roledescription="swipeable bill card"
      aria-label={bill.title}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      className="ring-gradient shadow-elegant absolute inset-0 flex cursor-grab touch-none select-none flex-col overflow-hidden rounded-3xl bg-card text-card-foreground outline-none focus-visible:ring-4 focus-visible:ring-primary/30 active:cursor-grabbing"
      style={{
        transform: `translateX(${translate}px) rotate(${rotate}deg)`,
        opacity: exiting ? 0 : 1,
        transition,
      }}
    >
      <div className="bg-brand-gradient relative aspect-[4/3] w-full shrink-0 overflow-hidden">
        <img
          src={src}
          alt={bill.title}
          data-testid="swipe-card-photo"
          draggable={false}
          onError={() => setImgFailed(true)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        {bill.category && (
          <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
            {bill.category}
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute right-4 top-4 -rotate-12 rounded-xl border-2 border-destructive bg-card/80 px-3 py-1 text-sm font-bold uppercase text-destructive"
          style={{ opacity: leftHint }}
        >
          Skip
        </span>
        <span
          aria-hidden="true"
          className="absolute left-4 top-12 rotate-12 rounded-xl border-2 border-success bg-card/80 px-3 py-1 text-sm font-bold uppercase text-success"
          style={{ opacity: rightHint }}
        >
          Help
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {bill.city && (
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{bill.city}</p>
        )}
        <h2 data-testid="swipe-card-title" className="text-lg font-semibold leading-snug text-foreground">
          {bill.title}
        </h2>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-muted/60 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needed</dt>
            <dd data-testid="swipe-card-needed" className="mt-0.5 font-semibold text-foreground">
              {formatNaira(needed)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raised</dt>
            <dd data-testid="swipe-card-raised" className="mt-0.5 font-semibold text-foreground">
              {formatNaira(raised)}
            </dd>
          </div>
        </dl>

        <ProgressBar value={raised} goal={needed} label={`${bill.title} funding progress`} />
        <p className="text-xs text-muted-foreground">{pct}% funded</p>
      </div>
    </article>
  );
}

export default SwipeCard;
