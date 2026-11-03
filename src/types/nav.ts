/**
 * Navigation contract shared by the header tabs, the mobile rail, the
 * persisted preference service and the `useNavPreferences` hook.
 *
 * This module is intentionally dependency-free (no imports from
 * `@/config/*` or `@/integrations/*`) so it can be imported from anywhere in
 * the module graph without creating a cycle.
 */

/** Every header destination, keyed by the id persisted in `nav_preferences`. */
export type NavTabId =
  | 'home'
  | 'discover'
  | 'recipients'
  | 'dashboard'
  | 'settings';

/** Ordered list of every valid tab id (also the persisted tab order). */
export const NAV_TAB_IDS: ReadonlyArray<NavTabId> = [
  'home',
  'discover',
  'recipients',
  'dashboard',
  'settings',
];

/** Narrowing guard used when reading localStorage / Supabase values. */
export function isNavTabId(value: unknown): value is NavTabId {
  return (
    typeof value === 'string' &&
    (NAV_TAB_IDS as ReadonlyArray<string>).includes(value)
  );
}

/** Router destinations the header links to. */
export type NavTo =
  | '/'
  | '/discover'
  | '/recipients'
  | '/dashboard'
  | '/settings';

/** One header destination. */
export interface NavItem {
  to: NavTo;
  label: string;
  /** Compact label painted on very narrow viewports. */
  shortLabel?: string;
  /** Explicit accessible name; falls back to `label`. */
  ariaLabel?: string;
}

/** A persisted tab id paired with the destination it renders. */
export interface NavTab {
  id: NavTabId;
  item: NavItem;
}

export type NavTabConfig = NavTab;

/** The full header tab set, in display order. */
export const NAV_TABS: ReadonlyArray<NavTab> = [
  { id: 'home', item: { to: '/', label: 'Home', shortLabel: 'Home' } },
  {
    id: 'discover',
    item: { to: '/discover', label: 'Discover', shortLabel: 'Discover' },
  },
  {
    id: 'recipients',
    item: { to: '/recipients', label: 'Recipients', shortLabel: 'Recipients' },
  },
  {
    id: 'dashboard',
    item: { to: '/dashboard', label: 'Dashboard', shortLabel: 'Dashboard' },
  },
  { id: 'settings', item: { to: '/settings', label: 'Settings', shortLabel: 'Settings' } },
];

/** Tab shown when nothing has been saved yet (and when persistence is down). */
export const DEFAULT_NAV_TAB: NavTabId = 'home';

/** localStorage mirror used for signed-out visitors and offline fallback. */
export const NAV_PREFERENCES_STORAGE_KEY = 'chief:nav-preferences';

/** Persisted preference payload (mirrored in localStorage, `tabs` in Supabase). */
export interface NavPreferences {
  activeTab: NavTabId;
  visibleTabs: NavTabId[];
  updatedAt: string;
}

/** Build the default payload for a given tab. */
export function createDefaultNavPreferences(
  activeTab: NavTabId = DEFAULT_NAV_TAB,
): NavPreferences {
  return {
    activeTab,
    visibleTabs: [...NAV_TAB_IDS],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Map a router pathname to the tab it belongs to, or `null` when the route is
 * not a header destination (so callers can fall back to the saved tab).
 */
export function navTabIdForPath(pathname: string): NavTabId | null {
  if (!pathname) return null;

  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname;

  for (const tab of NAV_TABS) {
    if (tab.item.to === normalized) return tab.id;
  }

  for (const tab of NAV_TABS) {
    if (tab.item.to === '/') continue;
    if (normalized.startsWith(`${tab.item.to}/`)) return tab.id;
  }

  return null;
}
