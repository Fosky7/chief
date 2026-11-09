import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { SampleBill } from "@/lib/sampleBills";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { ProgressBar } from "@/components/ProgressBar";

export type SwipeDirection = "left" | "right";

export interface SwipeCardProps {
  bill: SampleBill;
  onSwipe: (direction: SwipeDirection) => void;
}

/** Horizontal drag distance (px) that counts as a swipe. */
const THRESHOLD = 80;

/** Guarantees every card has a photo, even for rows without an image. */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=70";

export function SwipeCard({ bill, onSwipe }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);

  const title: string = bill?.title || "Untitled bill";
  const amount = Number(bill?.amount ?? bill?.goal ?? 0) || 0;
  const raised = Number(bill?.raised ?? 0) || 0;
  const remaining = Math.max(0, amount - raised);
  const pct = fundedPercent(raised, amount);
  const image: string = bill?.imageUrl || FALLBACK_IMAGE;
  const billId = String(bill?.id ?? "");

  const end = () => {
    if (start.current === null) return;
    start.current = null;
    if (dx > THRESHOLD) onSwipe("right");
    else if (dx < -THRESHOLD) onSwipe("left");
    setDx(0);
  };

  return (
    <article
      data-testid="top-bill-card"
      aria-label={title}
      className="ring-gradient shadow-elegant w-full touch-none select-none overflow-hidden rounded-3xl bg-card"
      style={{
        transform: `translateX(${dx}px) rotate(${dx / 20}deg)`,
        transition: start.current === null ? "transform 0.2s" : "none",
      }}
      onPointerDown={(event) => {
        start.current = event.clientX;
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (start.current !== null) setDx(event.clientX - start.current);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="relative">
        <img
          src={image}
          alt={title}
          draggable={false}
          className="h-48 w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent"
        />
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
            {bill?.category ?? "General"}
          </span>
          {bill?.location && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {bill.location}
            </span>
          )}
        </div>

        <h2 data-testid="top-bill-title" className="text-xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{bill?.summary ?? ""}</p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Needed</p>
            <p data-testid="top-bill-needed" className="font-semibold text-foreground">
              {formatNaira(remaining)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Raised</p>
            <p data-testid="top-bill-raised" className="font-semibold text-foreground">
              {formatNaira(raised)}
            </p>
          </div>
        </div>

        <ProgressBar
          value={pct}
          label={`${title} funding progress`}
          testId="top-bill-progress"
        />

        {billId && (
          <Link
            to="/bills/$id"
            params={{ id: billId }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline"
          >
            Read the full story <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}

export default SwipeCard;
