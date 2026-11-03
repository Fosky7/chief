import { HeaderTabList } from "@/components/HeaderTabs";
import { cx } from "@/config/containment";

/**
 * MobileNav
 *
 * The `< md` navigation rail: one horizontally scrollable row of tab pills
 * rendered under the header brand row. It deliberately renders NO brand mark —
 * the single labelled logo lives in `Header.tsx` and stays visible at every
 * width, so nothing here may hide or duplicate it.
 *
 * Structure (the hooks the Playwright specs assert):
 *
 *   <nav aria-label="Primary" data-mobile-nav data-header-rail-row>
 *     <div data-mobile-nav-rail data-header-nav-rail data-scroll-x>…tabs…</div>
 *   </nav>
 *
 * The rail itself never widens the document: `min-w-0` + `max-w-full` on both
 * the nav and the rail, plus `overflow-x: auto` from
 * `src/styles/header-nav.css`, means the row scrolls internally. Snapping is
 * avoided for reduced-motion users by the stylesheet.
 *
 * The destination list, the `isActivePath` helper and the pill class tokens
 * now live in `HeaderTabs.tsx`; they are re-exported below for backward
 * compatibility with existing consumers.
 */

export {
  HeaderTabLink,
  HeaderTabList,
  isActivePath,
  navLinkActive,
  navLinkBase,
  navLinkIdle,
  primaryNav,
} from "@/components/HeaderTabs";

export type { HeaderTabLinkProps, HeaderTabListProps } from "@/components/HeaderTabs";
export type { NavItem, NavTo } from "@/types/nav";

export interface MobileNavProps {
  /** Current router pathname; forwarded to the shared tab list. */
  pathname: string;
  className?: string | undefined;
}

export function MobileNav({ pathname, className }: MobileNavProps) {
  return (
    <nav
      aria-label="Primary"
      data-mobile-nav=""
      data-header-rail-row=""
      className={cx("w-full min-w-0 max-w-full md:hidden", className)}
    >
      <div
        data-mobile-nav-rail=""
        data-header-nav-rail=""
        data-scroll-x=""
        className="flex min-w-0 max-w-full flex-nowrap items-center gap-1.5 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-3 snap-x snap-proximity px-3 pb-2 pt-1"
      >
        <HeaderTabList pathname={pathname} />
      </div>
    </nav>
  );
}

export default MobileNav;
