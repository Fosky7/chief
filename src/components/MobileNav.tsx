import { useLocation } from "@tanstack/react-router";

import { cx } from "@/config/containment";
import { useNavPreferences } from "@/hooks/useNavPreferences";
import { NAV_TABS, navTabIdForPath } from "@/types/nav";
import type { NavItem, NavTabId } from "@/types/nav";
import { HeaderNavMenu, HeaderTabLink } from "@/components/HeaderTabs";

/**
 * MobileNav
 *
 * The `< md` header rail. It renders
 *
 *   [data-header-rail-row]          <- flex row, never wider than the viewport
 *     [data-header-menu-toggle]     <- the Menu control (opens the panel)
 *     [data-scroll-x]               <- the real horizontal scroll container
 *       … one HeaderTabLink per destination
 *
 * The rail scrolls *itself* (`overflow-x: auto`) instead of widening the
 * document, and from `md` up `header-nav.css` removes the whole row from paint
 * so the desktop inline nav is the only visible tab list.
 */

export interface MobileNavProps {
  /** Optional pathname override; defaults to the router location. */
  pathname?: string;
  className?: string;
  /** Optional destination override (defaults to the shared `NAV_TABS`). */
  items?: ReadonlyArray<NavItem>;
  [key: string]: unknown;
}

export function MobileNav({ pathname, className }: MobileNavProps = {}) {
  const location = useLocation();
  const { navTab, setNavTab } = useNavPreferences();

  const currentPath = pathname ?? location?.pathname ?? "/";
  const activeTabId: NavTabId = navTabIdForPath(currentPath) ?? navTab;

  return (
    <div
      data-header-rail-row=""
      className={cx(
        "flex w-full min-w-0 max-w-full flex-nowrap items-center gap-1 md:hidden",
        className,
      )}
    >
      <HeaderNavMenu pathname={currentPath} activeTabId={activeTabId} />

      <div
        data-scroll-x=""
        data-header-nav-rail=""
        className="flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain"
      >
        {NAV_TABS.map((tab) => (
          <HeaderTabLink
            key={tab.id}
            item={tab.item}
            pathname={currentPath}
            active={tab.id === activeTabId}
            onSelect={() => setNavTab(tab.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default MobileNav;
