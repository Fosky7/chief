import { useRef, useState, type PointerEvent } from 'react';
import { ProgressBar } from '@/components/ProgressBar';
import { formatNaira, fundedPercent } from '@/lib/currency';

export interface SwipeCardBill {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  image: string | null;
  city?: string;
}

interface SwipeCardProps {
  bill: SwipeCardBill;
  onSkip: () => void;
  onSupport: () => void;
}

const fallbackImage = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="white"/><text x="400" y="250" text-anchor="middle" font-size="28" fill="black">Bill photo unavailable</text></svg>')}`;

export function SwipeCard({ bill, onSkip, onSupport }: SwipeCardProps) {
  const gesture = useRef<{ id: number; x: number; y: number; width: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  function start(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button, a')) return;
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      width: event.currentTarget.getBoundingClientRect().width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function move(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    // Let vertical gestures remain normal page scrolling.
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 16) {
      cancel();
      return;
    }
    setOffset(dx);
  }

  function cancel() {
    gesture.current = null;
    setDragging(false);
    setOffset(0);
  }

  function finish(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const threshold = Math.min(120, start.width * 0.25);
    cancel();
    if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) onSkip();
    else onSupport();
  }

  return (
    <article
      data-testid="swipe-card"
      aria-labelledby={`bill-title-${bill.id}`}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      className={`ring-gradient shadow-elegant relative touch-pan-y select-none overflow-hidden rounded-3xl bg-card text-card-foreground ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        transform: `translateX(${offset}px) rotate(${offset / 28}deg)`,
        transition: dragging ? 'none' : 'transform 180ms ease-out',
      }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={bill.image || fallbackImage}
          alt={bill.title}
          draggable={false}
          loading="eager"
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackImage;
          }}
        />
        <span className="absolute left-4 top-4 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-card-foreground">
          {bill.category}
        </span>
        {Math.abs(offset) > 30 && (
          <span aria-hidden="true" className="absolute right-4 top-4 rounded-full bg-card px-4 py-2 font-bold text-primary">
            {offset < 0 ? 'Skip' : 'Give'}
          </span>
        )}
      </div>
      <div className="space-y-4 p-5 sm:p-6">
        {bill.city && <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{bill.city}</p>}
        <h2 id={`bill-title-${bill.id}`} className="text-2xl font-semibold leading-tight">{bill.title}</h2>
        {bill.description && <p className="text-sm leading-relaxed text-muted-foreground">{bill.description}</p>}
        <dl className="grid grid-cols-2 gap-4">
          <div><dt className="text-sm text-muted-foreground">Needed</dt><dd className="mt-1 text-lg font-semibold">{formatNaira(bill.goal)}</dd></div>
          <div className="text-right"><dt className="text-sm text-muted-foreground">Raised</dt><dd className="mt-1 text-lg font-semibold">{formatNaira(bill.raised)}</dd></div>
        </dl>
        <ProgressBar value={bill.raised} goal={bill.goal} label={`${bill.title} funding progress`} />
        <p className="text-xs text-muted-foreground">{fundedPercent(bill.raised, bill.goal)}% funded</p>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" onClick={onSkip} className="rounded-full border border-border px-5 py-3 font-semibold transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Skip</button>
          <button type="button" onClick={onSupport} className="bg-brand-gradient rounded-full px-5 py-3 font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Give</button>
        </div>
      </div>
    </article>
  );
}

export default SwipeCard;
