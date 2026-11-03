import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_NAV_TAB,
  NAV_PREFERENCE_EVENT,
  loadNavPreferences,
  saveNavPreferences,
} from '@/services/navPreferences';
import type { NavTabId } from '@/types/nav';

/**
 * Loads the persisted header tab and persists a new selection.
 *
 * - Signed-in: the value round-trips through `public.user_nav_preferences`
 *   (Supabase), so a reload restores it from the database.
 * - Guest/offline: the same value is mirrored in `localStorage`, so a reload
 *   still restores it and no error is ever logged.
 *
 * `setNavTab` updates optimistically and reverts (with a short notice) if the
 * write is rejected, so the UI never claims a save that did not happen.
 */

export interface UseNavPreferencesResult {
  navTab: NavTabId;
  setNavTab: (tab: NavTabId) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useNavPreferences(): UseNavPreferencesResult {
  const [navTab, setNavTabState] = useState<NavTabId>(DEFAULT_NAV_TAB);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentTab = useRef<NavTabId>(DEFAULT_NAV_TAB);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const preferences = await loadNavPreferences();
        if (cancelled) return;
        currentTab.current = preferences.activeTab;
        setNavTabState(preferences.activeTab);
      } catch {
        if (!cancelled) setError('Could not load your saved tab');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Keep every mounted header surface (desktop pills + mobile Menu) in step.
    const syncFromEvent = (event: Event) => {
      const detail = (event as CustomEvent<NavTabId>).detail;
      if (detail && detail !== currentTab.current) {
        currentTab.current = detail;
        setNavTabState(detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(NAV_PREFERENCE_EVENT, syncFromEvent);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener(NAV_PREFERENCE_EVENT, syncFromEvent);
      }
    };
  }, []);

  const setNavTab = useCallback(async (tab: NavTabId) => {
    const previous = currentTab.current;
    currentTab.current = tab;
    setNavTabState(tab);
    setError(null);

    try {
      await saveNavPreferences(tab);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent<NavTabId>(NAV_PREFERENCE_EVENT, { detail: tab }),
        );
      }
    } catch {
      currentTab.current = previous;
      setNavTabState(previous);
      setError('Could not save your tab');
    }
  }, []);

  return { navTab, setNavTab, loading, error };
}

export default useNavPreferences;
