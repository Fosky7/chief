import { useRef } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

import "@/styles/header-nav.css";
import { BrandLockup } from "@/components/BrandLockup";
import {
  MobileNav,
  isActivePath,
  navLinkActive,
  navLinkBase,
  navLinkIdle,
  primaryNav,
} from "@/components/MobileNav";
import { cx } from "@/config/containment";
import { interactive, layout } from "@/config/theme";

/**
 * Header
 *
 * The single sticky, fully mobile-responsive header rendered once by
 * `AppShell`.
 *
 * Logo: the header renders exactly ONE `<HeaderLogo />` unconditionally at the
 * start of the brand row. `<HeaderLogo />` → `<BrandMark />` → `<ChiefCapLogo />`
 * paints the Chief chief's-cap mark INLINE as `<svg role="img"
 * aria-label="ChiefCap logo">` with a matching `<title>`, a positive inline
 * size and `visibility:visible; opacity:1` — so the labelled logo is painted at
 * phone AND desktop widths, with no mount-time effect and no conditional branch
 * that could leave the slot empty on first paint.
 *
 * `<BrandLockup />` sits beside it and paints the wordmark only; it never adds a
 * second labelled mark (the verification spec asserts exactly one painted,
 * named logo inside the header).
 *
 * Design (unchanged): no opaque slab — only a translucent, blurred bar so the
 * single root `<ColorBackdrop />` still reads through. Every colour, gradient,
 * radius and focus ring comes from `src/config/theme.ts`; nothing here
 * hard-codes a hex/rgb value.
 *
 * Responsive behaviour:
 *   - >= md : a desktop pill nav beside the lockup (`hidden md:flex`);
 *   - <  md : a horizontally scrollable, single-row tab rail under the brand
 *             row (`<MobileNav />`, md:hidden). The rail is clipped to the
 *             viewport so it can never widen the document.
 *
 * Geometry hooks emitted for the stylesheet: `data-site-header` (+ the
 * `site-header` class), `data-header-brand-row`, `data-header-inner`,
 * `data-header-logo-slot` and `data-header-logo` / `data-chief-cap-logo` on the
 * mark itself.
 */

export function Header() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const headerRef = useRef<HTMLElement | null>(null);

  return (
    <header
      ref={headerRef}
      data-site-header=""
      className={cx(
        "site-header sticky top-0 z-40 w-full max-w-full border-b border-border bg-background/70 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-background/60",
      )}
    >
      {/* Keyboard users can jump straight past the chrome. */}
      <a
        href="#main-content"
        className={cx(
          "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50",
          "focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground",
          interactive.focusRing,
        )}
      >
        Skip to content
      </a>

      {/* Brand row: inline labelled mark + wordmark on the left, desktop nav on the right. */}
      <div
        data-header-inner=""
        data-header-brand-row=""
        className={cx(
          layout.container,
          "flex min-w-0 max-w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {/* The one and only labelled logo lives inside the lockup. */}
          <BrandLockup
            size="md"
            to="/"
            className="group min-w-0 shrink-0"
            linkClassName={cx(
              "inline-flex items-center py-1 pr-2",
              interactive.focusRing,
            )}
          />
        </div>

        {/* Desktop / tablet nav. */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={isActivePath(pathname, item.to) ? "page" : undefined}
              className={cx(
                navLinkBase,
                isActivePath(pathname, item.to) ? navLinkActive : navLinkIdle,
                interactive.focusRing,
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile rail: one scrollable row, clipped to the viewport. */}
      <MobileNav pathname={pathname} />
    </header>
  );
}

export default Header;
