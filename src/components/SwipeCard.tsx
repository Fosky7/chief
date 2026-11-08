import { forwardRef, useState, type HTMLAttributes } from "react";
import { CategoryBadge } from "@/components/ui/brand";
import { ProgressBar } from "@/components/ProgressBar";
import { formatNaira, fundedPercent } from "@/lib/currency";

type BadgeCategory = Parameters<typeof CategoryBadge>[0]["category"];

/** Minimal bill shape the card needs; compatible with sample and live bills. */
export type SwipeCardBill = {
  id: string;
  title: string;
  category: string;
  city?: string | null;
  raised: number;
  goal: number;
  imageUrl?: string | null;
  image?: string | null;
};

type SwipeCardProps = HTMLAttributes<HTMLElement> & {
  bill: SwipeCardBill;
  /** True for the interactive top card of the deck. */
  isTop?: boolean;
};

/**
 * Presentational bill card for the discover swipe deck.
 * Shows the bill photo, title, "Needed" (goal) and "Raised" amounts and a progress bar.
 * Pointer/drag handlers and transform styles are passed through from the deck.
 */
export const SwipeCard = forwardRef<HTMLElement, SwipeCardProps>(function SwipeCard(
  { bill, isTop = false, className, ...rest },
  ref,
) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = bill.imageUrl ?? bill.image ?? null;
  const pct = fundedPercent(bill.raised, bill.goal);

  return (
    <article
      ref={ref}
      data-testid={isTop ? "swipe-card-top" : "swipe-card"}
      aria-hidden={isTop ? undefined : true}
      aria-label={isTop ? bill.title : undefined}
      className={`shadow-elegant select-none overflow-hidden rounded-3xl bg-card ${isTop ? "ring-gradient" : ""} ${className ?? ""}`}
      {...rest}
    >
      <div className="bg-brand-gradient relative aspect-[4/3] overflow-hidden">
        {src && !imgFailed && (
          <img
            src={src}
            alt={bill.title}
            draggable={false}
            loading={isTop ? "eager" : "lazy"}
            decoding="async"
            onError={() => setImgFailed(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        <div className="absolute left-4 top-4">
          <CategoryBadge category={bill.category as BadgeCategory} className="bg-card/90 backdrop-blur" />
        </div>
        <span className="bg-brand-gradient shadow-elegant absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground">
          {pct}% funded
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div>
          {bill.city && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{bill.city}</p>
          )}
          <h2 className="mt-1 break-words text-xl font-semibold leading-snug text-foreground">{bill.title}</h2>
        </div>

        <ProgressBar value={bill.raised} goal={bill.goal} label={`${bill.title} funding progress`} />

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needed</dt>
            <dd className="mt-1 font-display text-lg font-semibold text-foreground" data-testid="swipe-card-needed">
              {formatNaira(bill.goal)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raised</dt>
            <dd className="mt-1 font-display text-lg font-semibold text-foreground" data-testid="swipe-card-raised">
              {formatNaira(bill.raised)}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
});

export default SwipeCard;
