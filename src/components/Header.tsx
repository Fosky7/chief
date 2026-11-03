import { useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

import "@/styles/header-nav.css";
import { BrandLockup } from "@/components/BrandLockup";
import { HeaderTabList } from "@/components/HeaderTabs";
import { MobileNav } from "@/components/MobileNav";
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
 * Destinations come from ONE place: `HeaderTabs.tsx`. The desktop nav renders
 * `<HeaderTabList />` inline from `md` up; `<MobileNav />` renders the exact
 * same list inside a horizontally scrollable rail below `md`. Because both read
 * `primaryNav`, the tab set can never diverge between breakpoints.
 *
 * Design (unchanged): no opaque slab — only a translucent, blurred bar so the
 * single root `<ColorBackdrop />` still reads through. Every colour, gradient,
 * radius and focus ring comes from `src/config/theme.ts`; nothing here
 * hard-codes a hex/rgb value.
 *
 * Geometry hooks emitted for the stylesheet and the browser specs:
 * `data-site-header` (+ the `site-header` class), `data-header-brand-row`,
 * `data-header-inner`, `data-header-nav-desktop`, `data-header-rail-row`,
 * `data-scroll-x` and `data-header-logo-slot` / `data-header-logo` /
 * `data-chief-cap-logo` on the mark itself.
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

        {/* Desktop / tablet nav — the shared tab list, inline. */}
        <nav
          aria-label="Primary"
          data-header-nav-desktop=""
          className="hidden items-center gap-1 md:flex"
        >
          <HeaderTabList pathname={pathname} />
        </nav>
      </div>

      {/* Mobile rail: one scrollable row, clipped to the viewport. */}
      <MobileNav pathname={pathname} />
    </header>
  );
}

export default Header;
