import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { ProgressBar } from "@/components/ProgressBar";

export type SwipeCardBill = {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  image: string | null;
};

type SwipeCardProps = {
  bill: SwipeCardBill;
  onSkip: () => void;
  onSupport: () => void;
};

/** Horizontal drag distance (px) needed to commit a swipe. */
const SWIPE_THRESHOLD = 110;

export function SwipeCard({ bill, onSkip, onSupport }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const start = useRef<{ x: number; id: number } | null>(null);

  const pct = bill.goal > 0 ? fundedPercent(bill.raised, bill.goal) : 0;
  const showImage = Boolean(bill.image) && !imageFailed;

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    // Let buttons receive normal clicks.
    if ((e.target as HTMLElement).closest("button")) return;
    start.current = { x: e.clientX, id: e.pointerId };
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture not supported */
    }
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (!start.current || start.current.id !== e.pointerId) return;
    setDx(e.clientX - start.current.x);
  }

  function finish(e: PointerEvent<HTMLElement>) {
    if (!start.current || start.current.id !== e.pointerId) return;
    const delta = e.clientX - start.current.x;
    start.current = null;
    setDragging(false);
    if (delta <= -SWIPE_THRESHOLD) {
      setDx(0);
      onSkip();
    } else if (delta >= SWIPE_THRESHOLD) {
      setDx(0);
      onSupport();
    } else {
      setDx(0);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onSkip();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onSupport();
    }
  }

  const rotation = Math.max(-15, Math.min(15, dx / 12));
  const hint = dx <= -40 ? "skip" : dx >= 40 ? "give" : null;

  return (
    <article
      data-testid="swipe-card"
      aria-label={bill.title}
      aria-roledescription="Swipeable bill card"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      className={`shadow-elegant relative touch-pan-y select-none overflow-hidden rounded-3xl border border-border bg-card text-card-foreground outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
        dragging ? "cursor-grabbing" : "cursor-grab transition-transform duration-300 ease-out"
      }`}
      style={{ transform: `translateX(${dx}px) rotate(${rotation}deg)` }}
    >
      <div className="bg-brand-gradient relative aspect-[4/3] w-full overflow-hidden">
        {showImage ? (
          <img
            src={bill.image ?? undefined}
            alt={bill.title}
            draggable={false}
            decoding="async"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={bill.title}
            className="absolute inset-0 flex items-center justify-center p-6 text-center font-display text-2xl font-semibold text-primary-foreground"
          >
            {bill.title}
          </div>
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
          {bill.category}
        </span>
        <span className="bg-brand-gradient absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground">
          {pct}% funded
        </span>
        {hint && (
          <span
            aria-hidden="true"
            className={`absolute top-1/2 -translate-y-1/2 rounded-full border-2 px-4 py-1.5 text-lg font-bold uppercase tracking-wider backdrop-blur ${
              hint === "skip"
                ? "right-6 rotate-12 border-destructive bg-destructive/15 text-destructive"
                : "left-6 -rotate-12 border-success bg-success/15 text-success"
            }`}
          >
            {hint === "skip" ? "Skip" : "Give"}
          </span>
        )}
      </div>

      <div className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold leading-snug text-foreground">{bill.title}</h2>
          {bill.description && (
            <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{bill.description}</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needed</dt>
            <dd data-testid="card-needed" className="mt-1 text-lg font-semibold text-foreground">
              {formatNaira(bill.goal)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raised</dt>
            <dd data-testid="card-raised" className="mt-1 text-lg font-semibold text-foreground">
              {formatNaira(bill.raised)}
            </dd>
          </div>
        </dl>

        <ProgressBar value={bill.raised} goal={bill.goal} label={`${bill.title} funding progress`} />

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-full border border-input bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:border-destructive/60 hover:text-destructive focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onSupport}
            className="bg-brand-gradient rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            Give
          </button>
        </div>
      </div>
    </article>
  );
}

export default SwipeCard;
