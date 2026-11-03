import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { createPortal } from 'react-dom';

import { cx } from '@/config/containment';
import { interactive } from '@/config/theme';
import { useNavPreferences } from '@/hooks/useNavPreferences';
import { NAV_TABS, navTabIdForPath } from '@/types/nav';
import type { NavItem, NavTabId } from '@/types/nav';

/**
 * HeaderTabs
 *
 * The single source of truth for the header's destinations *and* the pills
 * that render them. `Header.tsx` (desktop inline nav) and `MobileNav.tsx`
 * (the `< md` scroll rail) both consume the same primitives, so the tab set can
 * never diverge between breakpoints.
 *
 * Design notes
 * - Pills are `shrink-0 whitespace-nowrap`, so on a narrow phone rail they
 *   scroll horizontally instead of wrapping or truncating.
 * - The accessible name is ALWAYS the full `label` (via `aria-label`), even
 *   when a compact `shortLabel` is painted.
 * - Below `md` the `Menu` toggle + panel live in the rail (`MobileNav`); this
 *   module exports that control as `HeaderNavMenu` so both surfaces share one
 *   implementation.
 * - Everything is token driven (`interactive.focusRing`, `bg-primary`, ...).
 */

// Re-export the public nav contract so consumers of the old `MobileNav`
// barrel keep compiling unchanged.
export type { NavItem, NavTo } from '@/types/nav';

/** Primary navigation model (ids + labels aligned with the persisted keys). */
export const primaryNav: ReadonlyArray<NavItem> = NAV_TABS.map((tab) => tab.item);

/** Shared pill shape (colour is layered on top). */
export const navLinkBase =
  'inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors';

/** Active pill colour. */
export const navLinkActive = 'bg-primary text-primary-foreground shadow-sm';

/** Idle pill colour. */
export const navLinkIdle = 'text-muted-foreground hover:text-foreground';

/**
 * True when `pathname` is `to` or a nested route beneath it.
 * Returns `false` for an empty/undefined pathname (early router state).
 */
export function isActivePath(pathname: string, to: string): boolean {
  if (!pathname) return false;
  if (pathname === to) return true;
  if (to === '/') return false;
  return pathname.startsWith(`${to}/`);
}

export interface HeaderTabLinkProps {
  item: NavItem;
  /** Current router pathname; drives `aria-current` and the active colours. */
  pathname: string;
  /** Explicit active override (persisted selection wins where paths say nothing). */
  active?: boolean;
  /** Called on activation, after which the router navigates as usual. */
  onSelect?: () => void;
}

/**
 * One header destination rendered as a pill link.
 */
export function HeaderTabLink({
  item,
  pathname,
  active: activeOverride,
  onSelect,
}: HeaderTabLinkProps) {
  const active = activeOverride ?? isActivePath(pathname, item.to);
  const shortLabel = item.shortLabel ?? item.label;

  return (
    <Link
      to={item.to}
      onClick={onSelect}
      aria-current={active ? 'page' : undefined}
      aria-label={item.ariaLabel ?? item.label}
      className={cx(
        navLinkBase,
        active ? navLinkActive : navLinkIdle,
        interactive.focusRing,
        'shrink-0 whitespace-nowrap snap-start scroll-mx-3',
      )}
    >
      <span className='sm:hidden'>{shortLabel}</span>
      <span className='hidden sm:inline'>{item.label}</span>
    </Link>
  );
}

/**
 * Inline status message shown when a tab selection could not be persisted.
 * Dependency free so the header never pulls in a toast host it may not have.
 */
function NavPreferenceNotice({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <span
      role='status'
      aria-live='polite'
      data-nav-preference-notice=''
      className='ml-1 shrink-0 rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive'
    >
      {error}
    </span>
  );
}

export interface HeaderTabListProps {
  pathname?: string;
  className?: string;
  [key: string]: unknown;
}

/**
 * The inline tab list used by the desktop nav. Renders every header
 * destination with the persisted selection highlighted.
 */
export function HeaderTabList({ pathname, className }: HeaderTabListProps = {}) {
  const location = useLocation();
  const { navTab, setNavTab, error } = useNavPreferences();

  const currentPath = pathname ?? location?.pathname ?? '/';

  // The route wins when it maps to a tab; otherwise the persisted choice is
  // shown so a reload/deep link never loses the visual indicator.
  const activeTabId: NavTabId = navTabIdForPath(currentPath) ?? navTab;

  return (
    <div
      className={cx(
        'flex min-w-0 max-w-full flex-nowrap items-center gap-1 overflow-x-auto',
        className,
      )}
    >
      {NAV_TABS.map((tab) => (
        <HeaderTabLink
          key={tab.id}
          item={tab.item}
          pathname={currentPath}
          active={tab.id === activeTabId}
          onSelect={() => {
            void setNavTab(tab.id);
          }}
        />
      ))}
      <NavPreferenceNotice error={error} />
    </div>
  );
}

export interface HeaderNavMenuProps {
  /** Current router pathname. */
  pathname: string;
  /** Explicit active override for the panel rows. */
  activeTabId?: NavTabId;
  className?: string;
}

/**
 * The `< md` `Menu` control: a toggle plus a portalled panel listing every
 * header destination. Selecting one persists the choice through
 * `useNavPreferences` and then lets the `<Link>` navigate.
 */
export function HeaderNavMenu({ pathname, activeTabId, className }: HeaderNavMenuProps) {
  const { navTab, setNavTab, error } = useNavPreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const [canPortal, setCanPortal] = useState(false);

  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Portals only after mount so the first paint is unchanged.
  useEffect(() => {
    setCanPortal(true);
  }, []);

  // Dismiss the panel on Escape and on any outside pointer interaction.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [menuOpen]);

  const selectTab = useCallback(
    (tab: NavTabId) => {
      void setNavTab(tab);
      setMenuOpen(false);
    },
    [setNavTab],
  );

  // Roving focus inside the panel: ArrowUp/ArrowDown wrap, Home/End jump.
  const movePanelFocus = useCallback((key: string) => {
    const links = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('a[href]') ?? [],
    );
    if (links.length === 0) return false;

    const activeIndex = links.indexOf(document.activeElement as HTMLElement);
    let nextIndex: number;

    if (key === 'Home') {
      nextIndex = 0;
    } else if (key === 'End') {
      nextIndex = links.length - 1;
    } else if (key === 'ArrowUp') {
      nextIndex = activeIndex <= 0 ? links.length - 1 : activeIndex - 1;
    } else {
      nextIndex =
        activeIndex < 0 || activeIndex === links.length - 1 ? 0 : activeIndex + 1;
    }

    links[nextIndex]?.focus();
    return true;
  }, []);

  const resolvedActive: NavTabId =
    activeTabId ?? navTabIdForPath(pathname) ?? navTab;

  const panel =
    menuOpen && canPortal
      ? createPortal(
          <div
            ref={panelRef}
            data-header-menu-panel=''
            role='dialog'
            aria-label='Header menu'
            onKeyDown={(event) => {
              const key = event.key;
              if (
                key !== 'ArrowDown' &&
                key !== 'ArrowUp' &&
                key !== 'Home' &&
                key !== 'End'
              ) {
                return;
              }
              if (movePanelFocus(key)) event.preventDefault();
            }}
            className='flex flex-col gap-1 rounded-xl border p-2 shadow-lg'
            style={{
              position: 'fixed',
              top: '3.75rem',
              right: '0.75rem',
              zIndex: 70,
              minWidth: '11rem',
              maxWidth: 'min(18rem, calc(100vw - 1.5rem))',
              backgroundColor: 'hsl(var(--popover, 0 0% 100%))',
              color: 'hsl(var(--popover-foreground, 222 47% 11%))',
              borderColor: 'hsl(var(--border, 220 13% 91%))',
            }}
          >
            <ul className='flex list-none flex-col gap-1 p-0'>
              {NAV_TABS.map((tab) => (
                <li key={tab.id}>
                  <HeaderTabLink
                    item={tab.item}
                    pathname={pathname}
                    active={tab.id === resolvedActive}
                    onSelect={() => selectTab(tab.id)}
                  />
                </li>
              ))}
            </ul>
            <NavPreferenceNotice error={error} />
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={toggleRef}
        type='button'
        data-header-menu-toggle=''
        aria-label='Menu'
        aria-haspopup='dialog'
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className={cx(
          navLinkBase,
          navLinkIdle,
          interactive.focusRing,
          'shrink-0 whitespace-nowrap md:hidden',
          className,
        )}
      >
        Menu
      </button>
      {panel}
    </>
  );
}

export default HeaderTabList;
