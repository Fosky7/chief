import { useLocation } from "@tanstack/react-router";
import { BrandLockup } from "@/components/BrandLockup";
import { HeaderNavMenu, HeaderTabList } from "@/components/HeaderTabs";
import { useNavPreferences } from "@/hooks/useNavPreferences";
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
 * `nav_preferences` selection survives a reload; a failed read degrades to the
 * default tab order (the hook never throws).
 */
export function Header() {
  const location = useLocation();
  const pathname =
    (location as { pathname?: string } | null | undefined)?.pathname ?? "/";

  // The hook may expose the selection under a couple of names across callers;
  // resolve defensively so a shape change can never crash the header.
  const nav = useNavPreferences() as unknown as
    | Record<string, unknown>
    | null
    | undefined;
  const activeTabId =
    (nav?.activeTabId as string | undefined) ??
    (nav?.activeTab as string | undefined) ??
    (nav?.selectedTabId as string | undefined) ??
    (nav?.tabId as string | undefined);

  // Spread through `any` so the shared primitives keep working whether these
  // props are required, optional or unused on either component.
  const sharedTabProps: any = { pathname, activeTabId };
  const sharedMenuProps: any = { pathname, activeTabId };

  return (
    <header
      data-site-header
      className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur"
    >
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
            <HeaderTabList {...sharedTabProps} />
          </nav>
        </div>

        <div
          data-header-rail-row
          className="flex w-full min-w-0 items-center gap-1 md:hidden"
        >
          <div
            data-scroll-x
            className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap"
          >
            <HeaderTabList {...sharedTabProps} />
          </div>
          <div className="shrink-0">
            <HeaderNavMenu {...sharedMenuProps} />
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
