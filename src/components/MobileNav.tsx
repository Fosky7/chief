import { Link } from "@tanstack/react-router";

import { cx } from "@/config/containment";
import { interactive } from "@/config/theme";

/**
 * MobileNav
 *
 * The `< md` navigation rail: one horizontally scrollable row of tab pills
 * rendered under the header brand row. It deliberately renders NO brand mark —
 * the single labelled logo lives in `Header.tsx` and stays visible at every
 * width, so nothing here may hide or duplicate it.
 */

/** Primary navigation model — re-exported by `Header.tsx`. */
export interface NavItem {
  to: string;
  label: string;
}

export const primaryNav: ReadonlyArray<NavItem> = [
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
];

export const navLinkBase =
  "inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors";

export const navLinkActive = "bg-primary text-primary-foreground shadow-sm";

export const navLinkIdle = "text-muted-foreground hover:text-foreground";

/** True when `pathname` is `to` or a nested route beneath it. */
export function isActivePath(pathname: string, to: string): boolean {
  if (!pathname) return false;
  if (pathname === to) return true;
  return pathname.startsWith(`${to}/`);
}

export interface MobileNavProps {
  pathname: string;
  className?: string | undefined;
}

export function MobileNav({ pathname, className }: MobileNavProps) {
  return (
    <div
      data-mobile-nav=""
      className={cx("md:hidden", className)}
    >
      <div
        data-mobile-nav-rail=""
        className="flex flex-nowrap items-center gap-1 overflow-x-auto px-4 pb-2"
      >
        {primaryNav.map((item) => {
          const active = isActivePath(pathname, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cx(
                navLinkBase,
                active ? navLinkActive : navLinkIdle,
                interactive.focusRing,
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default MobileNav;
