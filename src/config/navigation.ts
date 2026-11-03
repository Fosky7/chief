import type { NavItem, NavTab, NavTabId } from "@/types/nav";

/**
 * Header destinations. The `id` is the persisted key stored in
 * `public.nav_preferences.active_tab`, so ids and labels stay aligned with the
 * nav-preferences contract.
 */
export const NAV_TABS: ReadonlyArray<NavTab> = [
  {
    id: "home",
    item: { to: "/", label: "Home", shortLabel: "Home" },
  },
  {
    id: "discover",
    item: { to: "/discover", label: "Discover", shortLabel: "Discover" },
  },
  {
    id: "recipients",
    item: { to: "/recipients", label: "Recipients", shortLabel: "People" },
  },
  {
    id: "dashboard",
    item: { to: "/dashboard", label: "Dashboard", shortLabel: "Dashboard" },
  },
  {
    id: "settings",
    item: { to: "/settings", label: "Settings", shortLabel: "Settings" },
  },
];

/** Plain nav items for consumers that only need the link model. */
export const primaryNavigation: ReadonlyArray<NavItem> = NAV_TABS.map(
  (tab) => tab.item,
);

export const navigation = primaryNavigation;

/**
 * Resolve the nav tab that owns a pathname. Longest matching prefix wins so a
 * recipient detail route still highlights `recipients`.
 */
export function navTabIdForPath(pathname: string): NavTabId | undefined {
  if (!pathname) return undefined;

  let best: { id: NavTabId; length: number } | undefined;

  for (const tab of NAV_TABS) {
    const to = tab.item.to;
    const matches =
      to === "/"
        ? pathname === "/"
        : pathname === to || pathname.startsWith(`${to}/`);

    if (!matches) continue;

    const length = to.length;
    if (!best || length > best.length) {
      best = { id: tab.id, length };
    }
  }

  return best?.id;
}

export function navItemForTab(id: NavTabId): NavItem | undefined {
  return NAV_TABS.find((tab) => tab.id === id)?.item;
}
