import { Link } from "@tanstack/react-router";

import { cx } from "@/config/containment";
import { interactive } from "@/config/theme";
import type { NavItem } from "@/types/nav";

/**
 * HeaderTabs
 *
 * The single source of truth for the header's destinations *and* the pills
 * that render them. `Header.tsx` (desktop inline nav) and `MobileNav.tsx`
 * (the `< md` scroll rail) both consume the same primitives, so the tab set
 * can never diverge between breakpoints.
 *
 * Design notes
 * - Pills are `shrink-0 whitespace-nowrap` with `snap-start`, so on a narrow
 *   phone rail they scroll horizontally instead of wrapping or truncating.
 * - The accessible name is ALWAYS the full `label` (via `aria-label`), even
 *   when the compact `shortLabel` is the painted text below `sm`. That keeps
 *   `getByRole('link', { name: 'Discover', exact: true })` matching at every
 *   viewport, and `shortLabel` stays a substring of `label` so WCAG 2.5.3
 *   (label in name) still holds.
 * - Everything is token driven (`interactive.focusRing`, `bg-primary`, ...).
 *   No hex/rgb value is hard-coded here.
 */

// Re-export the public nav contract so consumers of the old `MobileNav`
// barrel keep compiling unchanged.
export type { NavItem, NavTo } from "@/types/nav";

/**
 * Primary navigation model.
 *
 * `shortLabel` is paint-only and used below the `sm` breakpoint; it is kept
 * short enough to stay legible on a 320px rail.
 */
export const primaryNav: ReadonlyArray<NavItem> = [
  { to: "/discover", label: "Discover", shortLabel: "Discover" },
  { to: "/dashboard", label: "Dashboard", shortLabel: "Board" },
];

/** Shared pill shape (colour is layered on top). */
export const navLinkBase =
  "inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors";

/** Active pill colour. */
export const navLinkActive = "bg-primary text-primary-foreground shadow-sm";

/** Idle pill colour. */
export const navLinkIdle = "text-muted-foreground hover:text-foreground";

/**
 * True when `pathname` is `to` or a nested route beneath it.
 * Returns `false` for an empty/undefined pathname (early router state).
 */
export function isActivePath(pathname: string, to: string): boolean {
  if (!pathname) return false;
  if (pathname === to) return true;
  return pathname.startsWith(`${to}/`);
}

export interface HeaderTabLinkProps {
  item: NavItem;
  /** Current router pathname; drives `aria-current` and the active colours. */
  pathname: string;
}

/**
 * One header destination rendered as a pill link.
 *
 * The accessible name is pinned to the full `label` so assistive tech and the
 * exact-name Playwright assertions stay stable while a compact label paints.
 */
export function HeaderTabLink({ item, pathname }: HeaderTabLinkProps) {
  const active = isActivePath(pathname, item.to);
  const shortLabel = item.shortLabel ?? item.label;

  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      aria-label={item.ariaLabel ?? item.label}
      className={cx(
        navLinkBase,
        active ? navLinkActive : navLinkIdle,
        interactive.focusRing,
        "shrink-0 whitespace-nowrap snap-start scroll-mx-3",
      )}
    >
      <span className="sm:hidden">{shortLabel}</span>
      <span className="hidden sm:inline">{item.label}</span>
    </Link>
  );
}

export interface HeaderTabListProps {
  pathname: string;
  className?: string | undefined;
}

/**
 * The full tab list. Renders inline (`md:flex`) on desktop and inside the
 * scroll rail on phones — the same component either way.
 */
export function HeaderTabList({ pathname, className }: HeaderTabListProps) {
  return (
    <div
      className={cx(
        "flex min-w-0 max-w-full flex-nowrap items-center gap-1",
        className,
      )}
    >
      {primaryNav.map((item) => (
        <HeaderTabLink key={item.to} item={item} pathname={pathname} />
      ))}
    </div>
  );
}

export default HeaderTabList;
