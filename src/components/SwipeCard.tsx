import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { formatNairaAmount, type DeckBill } from "@/hooks/useApprovedBills";

const SWIPE_THRESHOLD = 100;

interface SwipeCardProps {
  bill: DeckBill;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  exiting?: "left" | "right" | null;
}

/** Draggable bill card. Drag left to skip, right to give. */
export function SwipeCard({ bill, onSwipeLeft, onSwipeRight, exiting = null }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button,a")) return;
    startX.current = e.clientX;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  };

  const finish = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    startX.current = null;
    setDragging(false);
    setDx(0);
    if (delta <= -SWIPE_THRESHOLD) onSwipeLeft();
    else if (delta >= SWIPE_THRESHOLD) onSwipeRight();
  };

  const translate = exiting === "left" ? -600 : exiting === "right" ? 600 : dx;
  const rotate = translate / 20;

  return (
    <div
      data-testid="swipe-card-top"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      className="glass shadow-elegant absolute inset-0 cursor-grab touch-none select-none overflow-hidden rounded-3xl bg-card active:cursor-grabbing"
      style={{
        transform: `translateX(${translate}px) rotate(${rotate}deg)`,
        transition: dragging ? "none" : "transform 250ms ease-out, opacity 250ms ease-out",
        opacity: exiting ? 0 : 1,
      }}
    >
      <div className="relative h-56 w-full bg-muted sm:h-64">
        <img
          src={bill.imageUrl}
          alt={`Photo for ${bill.title}`}
          draggable={false}
          className="h-full w-full object-cover"
          data-testid="bill-photo"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground">
          {bill.category}
        </span>
        {dx < -30 && (
          <span className="absolute right-4 top-4 rounded-md border-2 border-destructive px-2 py-1 text-sm font-bold text-destructive">
            SKIP
          </span>
        )}
        {dx > 30 && (
          <span className="absolute left-4 top-12 rounded-md border-2 border-primary px-2 py-1 text-sm font-bold text-primary">
            GIVE
          </span>
        )}
      </div>
      <div className="p-5">
        <h2 data-testid="bill-title" className="break-words text-xl font-semibold leading-snug text-foreground">
          {bill.title}
        </h2>
        {bill.city && <p className="mt-1 text-sm text-muted-foreground">{bill.city}</p>}
        <ProgressBar value={bill.raised} goal={bill.goal} className="mt-4" label={`${bill.title} funding progress`} />
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Needed</dt>
            <dd data-testid="bill-needed" className="text-lg font-semibold text-foreground">
              {formatNairaAmount(bill.goal)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Raised</dt>
            <dd data-testid="bill-raised" className="text-lg font-semibold text-primary">
              {formatNairaAmount(bill.raised)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default SwipeCard;
