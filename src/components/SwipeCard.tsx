import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ProgressBar } from "@/components/ProgressBar";

export type SwipeDirection = "left" | "right";

/** Minimal structural shape; other fields are read defensively. */
export interface SwipeCardBill {
  id: string;
}

interface SwipeCardProps {
  bill: SwipeCardBill;
  onSwipe: (dir: SwipeDirection) => void;
}

type AnyRecord = Record<string, unknown>;

const SWIPE_THRESHOLD = 110;

const FALLBACK_IMAGES: Record<string, string> = {
  education: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
  health: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
  housing: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
  rent: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
  default: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=70",
};

function pickString(r: AnyRecord, keys: string[], fallback = ""): string {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return fallback;
}

function pickNumber(r: AnyRecord, keys: string[]): number {
  for (const k of keys) {
    const v = r[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

/** Naira with thousands separators, e.g. ₦150,000. */
function naira(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

export function SwipeCard({ bill, onSwipe }: SwipeCardProps) {
  const r = bill as unknown as AnyRecord;
  const title = pickString(r, ["title", "name"], "Untitled bill");
  const category = pickString(r, ["category", "type"]);
  const city = pickString(r, ["city", "location"]);
  const image = pickString(
    r,
    ["image", "image_url", "imageUrl", "photo", "photo_url", "photoUrl", "cover_url"],
    FALLBACK_IMAGES[category.toLowerCase()] ?? FALLBACK_IMAGES.default,
  );
  const goal = pickNumber(r, ["goal", "goal_amount", "goalAmount", "needed", "amount_needed", "amountNeeded", "target", "amount"]);
  const raised = pickNumber(r, ["raised", "raised_amount", "amount_raised", "amountRaised", "funded", "funded_amount"]);
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    startX.current = e.clientX;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  }

  function finish() {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    if (dx <= -SWIPE_THRESHOLD) onSwipe("left");
    else if (dx >= SWIPE_THRESHOLD) onSwipe("right");
    setDx(0);
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "ArrowLeft") onSwipe("left");
    if (e.key === "ArrowRight") onSwipe("right");
  }

  return (
    <article
      data-testid="swipe-card"
      aria-label={`Bill: ${title}`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onKeyDown={onKeyDown}
      className={`shadow-elegant relative touch-none select-none overflow-hidden rounded-3xl border border-border bg-card text-card-foreground outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
        dragging ? "cursor-grabbing" : "cursor-grab transition-transform duration-300"
      }`}
      style={{ transform: `translateX(${dx}px) rotate(${dx / 20}deg)` }}
    >
      <div className="bg-brand-gradient relative aspect-[4/3] overflow-hidden">
        <img
          data-testid="swipe-card-photo"
          src={image}
          alt={title}
          draggable={false}
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        {category && (
          <span className="absolute left-4 top-4 rounded-full bg-card/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
            {category}
          </span>
        )}
        <span className="bg-brand-gradient absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground">
          {pct}% funded
        </span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          {city && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{city}</p>}
          <h2 data-testid="swipe-card-title" className="mt-1 text-xl font-semibold leading-snug text-foreground">
            {title}
          </h2>
        </div>
        <ProgressBar value={raised} goal={goal} label={`${title} funding progress`} />
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-muted/50 p-3">
            <dt className="text-xs font-medium text-muted-foreground">Needed</dt>
            <dd data-testid="swipe-card-needed" className="mt-0.5 font-semibold text-foreground">
              {naira(goal)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/50 p-3">
            <dt className="text-xs font-medium text-muted-foreground">Raised</dt>
            <dd data-testid="swipe-card-raised" className="mt-0.5 font-semibold text-foreground">
              {naira(raised)}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default SwipeCard;
