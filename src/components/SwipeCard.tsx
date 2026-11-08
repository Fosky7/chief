import { useRef, useState } from "react";
import type { DeckBill } from "@/hooks/useApprovedBills";
import { ProgressBar } from "@/components/ProgressBar";

export function naira(amount: number): string {
  return "₦" + Math.round(amount || 0).toLocaleString("en-NG");
}

interface SwipeCardProps {
  bill: DeckBill;
  onSwipe: (dir: "left" | "right") => void;
}

const THRESHOLD = 110;

export function SwipeCard({ bill, onSwipe }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const pct = bill.goal > 0 ? (bill.raised / bill.goal) * 100 : 0;

  const end = () => {
    if (start.current === null) return;
    start.current = null;
    if (dx > THRESHOLD) onSwipe("right");
    else if (dx < -THRESHOLD) onSwipe("left");
    setDx(0);
  };

  return (
    <div
      data-testid="swipe-card"
      className="relative w-full select-none touch-none overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl"
      style={{ transform: `translateX(${dx}px) rotate(${dx / 20}deg)`, transition: start.current === null ? "transform 0.25s" : "none" }}
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
        <img src={bill.imageUrl} alt="" className="h-48 w-full object-cover" draggable={false} />
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-emerald-500/40 to-cyan-500/30" />
      )}
      <div className="space-y-3 p-6">
        <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">{bill.category}</span>
        <h2 data-testid="swipe-card-title" className="text-2xl font-bold text-white">{bill.title}</h2>
        {bill.description && <p className="line-clamp-3 text-sm text-white/70">{bill.description}</p>}
        <div className="flex justify-between text-sm text-white">
          <span data-testid="swipe-card-raised">{naira(bill.raised)} raised</span>
          <span data-testid="swipe-card-goal">of {naira(bill.goal)}</span>
        </div>
        <ProgressBar value={pct} label="Funded" />
      </div>
    </div>
  );
}

export default SwipeCard;
