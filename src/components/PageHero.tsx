import type { ReactNode } from "react";

import { cx } from "@/config/containment";
import { gradients, layout, typography } from "@/config/theme";

/**
 * PageHero
 *
 * The single shared page header used by every route.
 *
 * It encodes the reverted (calm) composition so no route can accidentally
 * re-introduce the heavier visual pass:
 *
 *  - exactly ONE aurora band (`gradients.heroAurora`) per page,
 *  - no stacked page wash, no radial sheen,
 *  - no `heroAuroraRose` variant.
 *
 * All colours/typography come from `src/config/theme.ts` (no hardcoded
 * values here) and all width containment comes from `@/config/containment`.
 */

export type PageHeroProps = {
  /** Small uppercase label rendered above the title. */
  eyebrow?: ReactNode;
  /** Page headline (rendered as the single h1 of the page). */
  title: ReactNode;
  /** Supporting paragraph rendered under the title. */
  description?: ReactNode;
  /** Optional CTA row (buttons / links) rendered under the description. */
  actions?: ReactNode;
  /** Optional anchor id for in-page links. */
  id?: string;
  /** Extra classes appended after the token-driven ones. */
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  id,
  className,
}: PageHeroProps) {
  return (
    <section
      id={id}
      className={cx("border-b border-border", gradients.heroAurora, className)}
    >
      <div className={cx(layout.container, "py-14 sm:py-20")}>
        {eyebrow ? <p className={typography.eyebrow}>{eyebrow}</p> : null}

        <h1 className={cx("mt-3 max-w-3xl", typography.display)}>{title}</h1>

        {description ? (
          <p className={cx("mt-4 max-w-2xl", typography.body)}>{description}</p>
        ) : null}

        {actions ? (
          <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}

export default PageHero;
