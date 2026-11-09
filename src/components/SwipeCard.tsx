import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ProgressBar, percentOf } from "@/components/ProgressBar";

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

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=70";

/** Distance in px the card must travel before a release counts as a swipe. */
const SWIPE_THRESHOLD = 100;
const EXIT_MS = 220;

const nairaGroup = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });

function naira(n: number): string {
  return `₦${nairaGroup.format(Number.isFinite(n) ? Math.round(n) : 0)}`;
}

export function SwipeCard({ bill, onSkip, onSupport }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const [imgSrc, setImgSrc] = useState(bill.image || FALLBACK_IMAGE);
  const startX = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setImgSrc(bill.image || FALLBACK_IMAGE);
  }, [bill.image]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const pct = percentOf(bill.raised, bill.goal);

  function finish(direction: "left" | "right") {
    if (exiting) return;
    setExiting(direction);
    timer.current = setTimeout(() => {
      if (direction === "left") onSkip();
      else onSupport();
    }, EXIT_MS);
  }

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    if (exiting) return;
    // Let buttons handle their own clicks.
    if ((e.target as HTMLElement).closest("button")) return;
    startX.current = e.clientX;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture unsupported */
    }
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  }

  function onPointerUp() {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    if (dx <= -SWIPE_THRESHOLD) finish("left");
    else if (dx >= SWIPE_THRESHOLD) finish("right");
    else setDx(0);
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      finish("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      finish("right");
    }
  }

  const offset = exiting === "left" ? -600 : exiting === "right" ? 600 : dx;
  const rotate = Math.max(-18, Math.min(18, offset / 20));
  const hint = exiting ?? (dx <= -40 ? "left" : dx >= 40 ? "right" : null);

  return (
    <article
      data-testid="swipe-card"
      aria-label={`Bill: ${bill.title}. Use left arrow to skip, right arrow to give.`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className="ring-gradient shadow-elegant relative touch-pan-y select-none overflow-hidden rounded-3xl bg-card text-card-foreground outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
      style={{
        transform: `translateX(${offset}px) rotate(${rotate}deg)`,
        transition: dragging ? "none" : `transform ${EXIT_MS}ms ease-out, opacity ${EXIT_MS}ms ease-out`,
        opacity: exiting ? 0 : 1,
        cursor: dragging ? "grabbing" : "grab",
      }}
    >
      <div className="bg-brand-gradient relative aspect-[4/3] overflow-hidden">
        <img
          src={imgSrc}
          alt={bill.title}
          draggable={false}
          decoding="async"
          onError={() => {
            if (imgSrc !== FALLBACK_IMAGE) setImgSrc(FALLBACK_IMAGE);
          }}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
          {bill.category}
        </span>
        {hint === "left" && (
          <span
            aria-hidden="true"
            className="absolute right-4 top-4 -rotate-12 rounded-xl border-2 border-destructive bg-card/90 px-3 py-1 text-sm font-bold uppercase text-destructive"
          >
            Skip
          </span>
        )}
        {hint === "right" && (
          <span
            aria-hidden="true"
            className="absolute left-4 top-12 rotate-12 rounded-xl border-2 border-success bg-card/90 px-3 py-1 text-sm font-bold uppercase text-success"
          >
            Give
          </span>
        )}
      </div>

      <div className="space-y-4 p-5">
        <h2 data-testid="swipe-card-title" className="text-xl font-semibold leading-snug text-foreground">
          {bill.title}
        </h2>
        {bill.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{bill.description}</p>
        ) : null}

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/60 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needed</dt>
            <dd data-testid="amount-needed" className="mt-1 font-semibold text-foreground">
              {naira(bill.goal)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 p-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raised</dt>
            <dd data-testid="amount-raised" className="mt-1 font-semibold text-foreground">
              {naira(bill.raised)}
            </dd>
          </div>
        </dl>

        <div>
          <ProgressBar value={bill.raised} goal={bill.goal} label={`${bill.title} funding progress`} />
          <p className="mt-1.5 text-xs text-muted-foreground">{pct}% funded</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={() => finish("left")}
            disabled={exiting !== null}
            className="flex-1 rounded-full border border-input px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={() => finish("right")}
            disabled={exiting !== null}
            className="bg-brand-gradient shadow-elegant flex-1 rounded-full px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          >
            Give
          </button>
        </div>
      </div>
    </article>
  );
}

export default SwipeCard;
