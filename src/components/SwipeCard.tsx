import * as React from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { formatNaira, progressPercent } from "@/lib/currency";
import type { ApprovedBill } from "@/hooks/useApprovedBills";

const THRESHOLD = 120;

export function SwipeCard({ bill, onSwipeLeft, onSwipeRight }: { bill: ApprovedBill; onSwipeLeft: () => void; onSwipeRight?: () => void }) {
  const [dx, setDx] = React.useState(0);
  const start = React.useRef<number | null>(null);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    start.current = e.clientX;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (start.current === null) return;
    setDx(e.clientX - start.current);
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (start.current === null) return;
    const delta = e.clientX - start.current;
    start.current = null;
    setDx(0);
    if (delta < -THRESHOLD) onSwipeLeft();
    else if (delta > THRESHOLD) (onSwipeRight ?? onSwipeLeft)();
  };

  return (
    <div
      data-testid="swipe-card"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => {
        start.current = null;
        setDx(0);
      }}
      className="select-none touch-none overflow-hidden rounded-2xl bg-white shadow-lg"
      style={{ transform: `translateX(${dx}px) rotate(${dx / 20}deg)`, transition: start.current === null ? "transform 0.2s" : "none" }}
    >
      <img src={bill.imageUrl} alt={bill.title} draggable={false} className="h-56 w-full object-cover" />
      <div className="space-y-3 p-4">
        <h2 className="text-xl font-semibold" data-testid="card-title">{bill.title}</h2>
        {bill.description && <p className="text-sm text-gray-600">{bill.description}</p>}
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-gray-500">Needed</span>{" "}
            <span className="font-semibold" data-testid="amount-needed">{formatNaira(bill.amountNeeded)}</span>
          </div>
          <div>
            <span className="text-gray-500">Raised</span>{" "}
            <span className="font-semibold" data-testid="amount-raised">{formatNaira(bill.amountRaised)}</span>
          </div>
        </div>
        <ProgressBar value={progressPercent(bill.amountRaised, bill.amountNeeded)} />
      </div>
    </div>
  );
}

export default SwipeCard;
