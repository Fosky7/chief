import type { ReactNode, Ref } from "react";

import { cx } from "@/config/containment";
import { layout, typography } from "@/config/theme";

/**
 * PageSection
 *
 * Shared content-section wrapper: `layout.container` + `layout.section`
 * inside a `layout.headerOffset` anchor target, so in-page links
 * (`#how-it-works`, `#verified-requests`, …) never land under the sticky
 * header.
 *
 * Children are passed through untouched — callers own their cards, lists and
 * grids and simply use the `surfaces.card` token. This keeps the reverted
 * composition (`ColorBackdrop` only, one `heroAurora` band per page, plain
 * cards) identical on every route without any route re-implementing it.
 */

export type PageSectionProps = {
  /** Anchor id for in-page navigation. */
  id?: string;
  /** Section heading (rendered as an h2). Omit for heading-less sections. */
  heading?: ReactNode;
  /** Optional supporting paragraph rendered under the heading. */
  description?: ReactNode;
  /** Card / list / grid content — rendered as-is. */
  children: ReactNode;
  /** Override the heading element id. Defaults to `${id}-heading`. */
  headingId?: string;
  /** Override the section `aria-labelledby` value. */
  labelledBy?: string;
  /** Extra classes appended after the token-driven ones. */
  className?: string;
  /**
   * Ref to the underlying `<section>`. Used by the landing page to scroll the
   * revealed "Verified requests" section into view.
   */
  sectionRef?: Ref<HTMLElement>;
  /** React 19 style ref alias (kept for callers that prefer `ref`). */
  ref?: Ref<HTMLElement>;
};

export function PageSection({
  id,
  heading,
  description,
  children,
  headingId,
  labelledBy,
  className,
  sectionRef,
  ref,
}: PageSectionProps) {
  const resolvedHeadingId = headingId ?? (id ? `${id}-heading` : undefined);
  const resolvedLabelledBy =
    labelledBy ?? (heading ? resolvedHeadingId : undefined);
  const resolvedRef = sectionRef ?? ref ?? null;

  return (
    <section
      id={id}
      ref={resolvedRef}
      aria-labelledby={resolvedLabelledBy}
      className={cx(layout.headerOffset, className)}
    >
      <div className={cx(layout.container, layout.section)}>
        {heading ? (
          <h2 id={resolvedHeadingId} className={typography.heading}>
            {heading}
          </h2>
        ) : null}

        {description ? (
          <p className={cx("mt-3 max-w-2xl", typography.body)}>{description}</p>
        ) : null}

        {children}
      </div>
    </section>
  );
}

export default PageSection;
