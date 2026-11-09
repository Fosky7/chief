import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Heart, ChevronRight } from "lucide-react";
import { formatNaira, fundedPercent } from "@/lib/currency";

export interface SwipeCardBill {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  image?: string | null;
}

interface SwipeCardProps {
  bill: SwipeCardBill;
  onSkip: () => void;
  onSupport: () => void;
}

const THRESHOLD = 110;

export function SwipeCard({ bill, onSkip, onSupport }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const offset = useRef(0);
  const pct = fundedPercent(bill.raised, bill.goal);

  const reset = () => {
    setDragging(false);
    startX.current = null;
    offset.current = 0;
    setDx(0);
  };

  const end = () => {
    const distance = offset.current;
    reset();
    if (distance > THRESHOLD) onSupport();
    else if (distance < -THRESHOLD) onSkip();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        data-testid="swipe-card"
        className="relative rounded-3xl border border-white/10 bg-neutral-900/80 p-6 shadow-xl select-none touch-pan-y"
        style={{
          transform: `translateX(${dx}px) rotate(${dx / 20}deg)`,
          transition: dragging ? "none" : "transform 200ms ease",
        }}
        onPointerDown={(e) => {
          if (e.button !== 0 || (e.target as HTMLElement).closest("a, button, input")) return;
          startX.current = e.clientX;
          offset.current = 0;
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
        }}
        onPointerMove={(e) => {
          if (startX.current !== null) {
            offset.current = e.clientX - startX.current;
            setDx(offset.current);
          }
        }}
        onPointerUp={() => {
          if (startX.current !== null) end();
        }}
        onPointerCancel={reset}
      >
        <img
          src={bill.image || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80"}
          alt={bill.title}
          draggable={false}
          className="mb-4 h-44 w-full rounded-2xl object-cover"
        />
        <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
          {bill.category}
        </span>
        <h2 data-testid="swipe-card-title" className="mt-3 text-2xl font-bold text-white">
          {bill.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm text-white/70">{bill.description}</p>
        <div className="mt-5">
          <div className="grid grid-cols-2 gap-3 text-sm text-white">
            <div data-testid="swipe-card-raised" className="rounded-xl bg-white/5 p-3">
              <span className="block text-white/80">Raised</span>{" "}
              <span className="font-semibold">{formatNaira(bill.raised)}</span>
            </div>
            <div data-testid="swipe-card-goal" className="rounded-xl bg-white/5 p-3">
              <span className="block text-white/80">Needed</span>{" "}
              <span className="font-semibold">{formatNaira(bill.goal)}</span>
            </div>
          </div>
          <div
            role="progressbar"
            aria-label="Funding progress"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-white/60">{pct}% funded</div>
        </div>
        <Link
          to="/bills/$id"
          params={{ id: bill.id }}
          className="mt-4 inline-flex items-center text-sm text-emerald-300 hover:underline"
        >
          View details <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-6 flex items-center justify-center gap-6">
        <button
          type="button"
          data-testid="swipe-skip"
          aria-label="Skip"
          onClick={onSkip}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-neutral-900 text-white hover:bg-neutral-800"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          type="button"
          data-testid="swipe-support"
          aria-label="Give"
          onClick={onSupport}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-black hover:bg-emerald-400"
        >
          <Heart className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

export default SwipeCard;
