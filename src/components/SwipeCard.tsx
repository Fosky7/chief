import { useRef, useState } from "react";
import { Heart, MapPin, X, CheckCircle2 } from "lucide-react";
import { formatNaira } from "@/lib/currency";

export type SwipeBill = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  goal: number;
  raised: number;
  imageUrl?: string | null;
  sample?: boolean;
};

export type SwipeCardProps = {
  bill: SwipeBill;
  thanked?: boolean;
  onDonate: (bill: SwipeBill) => void;
  onSkip?: (bill: SwipeBill) => void;
};

const SWIPE_THRESHOLD = 110;

/** A bill card: drag right to donate, left to skip, or use the buttons. */
export function SwipeCard({ bill, thanked = false, onDonate, onSkip }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);

  const goal = Math.max(0, bill.goal);
  const raised = Math.max(0, bill.raised);
  const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    startX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current !== null) setDx(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    if (dx > SWIPE_THRESHOLD) onDonate(bill);
    else if (dx < -SWIPE_THRESHOLD) onSkip?.(bill);
    startX.current = null;
    setDx(0);
  };

  return (
    <article
      data-testid="swipe-card"
      aria-label={bill.title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      style={{ transform: `translateX(${dx}px) rotate(${dx / 25}deg)` }}
      className="touch-pan-y select-none overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-lg transition-transform"
    >
      {bill.imageUrl ? (
        <img src={bill.imageUrl} alt="" className="h-48 w-full object-cover" draggable={false} />
      ) : (
        <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-accent/30" aria-hidden="true" />
      )}
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {bill.category && <span className="rounded-full bg-muted px-2 py-0.5">{bill.category}</span>}
          {bill.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {bill.city}
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold">{bill.title}</h2>
        {bill.description && <p className="line-clamp-3 text-sm text-muted-foreground">{bill.description}</p>}

        <div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Funding progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span>
              <span className="text-muted-foreground">Raised </span>
              <span data-testid="raised-amount" className="font-semibold">
                {formatNaira(raised)}
              </span>
            </span>
            <span className="text-muted-foreground">of {formatNaira(goal)}</span>
          </div>
        </div>

        {thanked && (
          <p role="status" className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" />
            Thank you for giving
          </p>
        )}

        <div className="flex gap-3 pt-1">
          {onSkip && (
            <button
              type="button"
              onClick={() => onSkip(bill)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border py-3 font-semibold hover:bg-muted"
            >
              <X className="h-4 w-4" />
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={() => onDonate(bill)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground"
          >
            <Heart className="h-4 w-4" />
            Donate
          </button>
        </div>
      </div>
    </article>
  );
}

export default SwipeCard;
