import { useRef, useState } from "react";
import { MapPin } from "lucide-react";
import type { SampleBill } from "@/lib/sampleBills";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { ProgressBar } from "@/components/ProgressBar";

export type SwipeDirection = "left" | "right";

interface SwipeCardProps {
  bill: SampleBill;
  onSwipe: (direction: SwipeDirection) => void;
}

const THRESHOLD = 100;

export function SwipeCard({ bill, onSwipe }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const pct = fundedPercent(bill.raised, bill.amount);
  const remaining = Math.max(0, bill.amount - bill.raised);

  const end = () => {
    if (start.current === null) return;
    start.current = null;
    if (dx > THRESHOLD) onSwipe("right");
    else if (dx < -THRESHOLD) onSwipe("left");
    setDx(0);
  };

  return (
    <article
      data-testid="swipe-card"
      aria-label={bill.title}
      className="w-full touch-none select-none overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-xl"
      style={{
        transform: `translateX(${dx}px) rotate(${dx / 20}deg)`,
        transition: start.current === null ? "transform 0.2s" : "none",
      }}
      onPointerDown={(e) => {
        start.current = e.clientX;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current !== null) setDx(e.clientX - start.current);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {bill.imageUrl ? (
        <img src={bill.imageUrl} alt="" draggable={false} className="h-48 w-full object-cover" />
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-emerald-500/30 to-teal-700/30" />
      )}
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between text-xs">
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">{bill.category}</span>
          {bill.location && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {bill.location}
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold text-white">{bill.title}</h2>
        <p className="text-sm text-muted-foreground">{bill.summary}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Needed</p>
            <p className="font-semibold text-white">{formatNaira(remaining)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Goal</p>
            <p className="font-semibold text-white">{formatNaira(bill.amount)}</p>
          </div>
        </div>
        <ProgressBar value={pct} max={100} label={`${formatNaira(bill.raised)} raised`} />
      </div>
    </article>
  );
}
