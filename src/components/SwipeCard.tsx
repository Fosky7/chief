import { forwardRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { CategoryBadge } from "@/components/ui/brand";
import { ProgressBar } from "@/components/ProgressBar";
import { formatNaira, fundedPercent } from "@/lib/currency";
import type { DeckBill } from "@/hooks/useApprovedBills";

type BadgeCategory = Parameters<typeof CategoryBadge>[0]["category"];

export interface SwipeCardProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  bill: DeckBill;
  /** Eager-load the photo (use for the top card). */
  eager?: boolean;
  /** Optional extra content rendered under the amounts (e.g. actions). */
  footer?: ReactNode;
}

/**
 * A single bill card in the discovery deck: photo, title, Needed / Raised
 * amounts and a funding progress bar. Forwards its ref and HTML props so the
 * deck can attach pointer/drag handlers and transforms.
 */
export const SwipeCard = forwardRef<HTMLElement, SwipeCardProps>(function SwipeCard(
  { bill, eager = false, footer, className, ...rest },
  ref,
) {
  const [imgFailed, setImgFailed] = useState(false);
  const pct = fundedPercent(bill.raised, bill.goal);
  const showImage = Boolean(bill.imageUrl) && !imgFailed;

  return (
    <article
      ref={ref}
      data-testid="bill-card"
      aria-label={bill.title}
      className={`ring-gradient shadow-elegant select-none overflow-hidden rounded-3xl bg-card ${className ?? ""}`}
      {...rest}
    >
      <div className="bg-brand-gradient relative aspect-[4/3] overflow-hidden">
        {showImage && (
          <img
            src={bill.imageUrl ?? undefined}
            alt={bill.title}
            data-testid="bill-photo"
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            onError={() => setImgFailed(true)}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        )}
        {!showImage && (
          <div
            role="img"
            aria-label={bill.title}
            data-testid="bill-photo"
            className="absolute inset-0 flex items-center justify-center font-display text-6xl font-bold text-primary-foreground/80"
          >
            {bill.title.charAt(0).toUpperCase()}
          </div>
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
        <div className="absolute left-4 top-4">
          <CategoryBadge category={bill.category as BadgeCategory} className="bg-card/90 backdrop-blur" />
        </div>
        <span className="bg-brand-gradient absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-elegant">
          {pct}% funded
        </span>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{bill.city}</p>
          <h2 data-testid="bill-title" className="mt-1.5 break-words text-xl font-semibold leading-snug text-foreground">
            {bill.title}
          </h2>
        </div>

        <ProgressBar value={bill.raised} goal={bill.goal} label={`${bill.title} funding progress`} />

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-muted/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Needed</dt>
            <dd data-testid="bill-needed" className="mt-1 font-display text-lg font-semibold text-foreground">
              {formatNaira(bill.goal)}
            </dd>
          </div>
          <div className="rounded-2xl bg-muted/60 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Raised</dt>
            <dd data-testid="bill-raised" className="mt-1 font-display text-lg font-semibold text-foreground">
              {formatNaira(bill.raised)}
            </dd>
          </div>
        </dl>

        {footer}
      </div>
    </article>
  );
});

export default SwipeCard;
