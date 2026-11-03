import { useLocation } from "@tanstack/react-router";
import { BrandLockup } from "@/components/BrandLockup";
import { HeaderNavMenu, HeaderTabList } from "@/components/HeaderTabs";
import { useNavPreferences } from "@/hooks/useNavPreferences";
import { navTabIdForPath } from "@/types/nav";
import type { NavTabId } from "@/types/nav";
import "@/styles/header-nav.css";

/**
 * Site header.
 *
 * Layout contract (see src/styles/header-nav.css and the header specs):
 * - desktop (>= 768px): one row, brand on the left, all tabs right-aligned
 *   inside `nav[aria-label="Primary"][data-header-nav-desktop]`.
 * - mobile (< 768px): `[data-header-brand-row]` plus `[data-header-rail-row]`,
 *   which holds a horizontally scrollable tab rail (`[data-scroll-x]`) and the
 *   existing MobileNav drawer toggle (`[data-header-menu-toggle]`).
 *
 * The active tab is resolved from `useNavPreferences()` so the persisted
 * selection survives a reload; a failed read degrades to the default tab order
 * (the hook never throws).
 */
export function Header() {
  const location = useLocation();
  const pathname =
    (location as { pathname?: string } | null | undefined)?.pathname ?? "/";
  const { navTab } = useNavPreferences();
  const activeTabId: NavTabId = navTabIdForPath(pathname) ?? navTab;

  return (
    <header
      data-site-header
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <div
          data-header-brand-row
          className="flex w-full min-w-0 items-center gap-3"
        >
          <BrandLockup />
          <nav
            aria-label="Primary"
            data-header-nav-desktop
            className="ml-auto hidden md:flex md:items-center"
          >
            <HeaderTabList pathname={pathname} />
          </nav>
        </div>

        <nav
          aria-label="Primary mobile"
          data-header-rail-row
          className="flex w-full min-w-0 items-center gap-2 md:hidden"
        >
          <HeaderTabList
            pathname={pathname}
            data-scroll-x=""
            className="flex-1 pr-1"
          />
          <HeaderNavMenu pathname={pathname} activeTabId={activeTabId} />
        </nav>
      </div>
    </header>
  );
}

export default Header;
