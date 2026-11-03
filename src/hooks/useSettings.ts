import { useCallback, useEffect, useRef, useState } from "react";

import { getNavTabSetting, setNavTabSetting } from "@/services/settings";
import {
  DEFAULT_DONOR_PREFERENCES,
  type NavTabId,
  type PreferenceSource,
} from "@/types/preferences";

/**
 * Settings hook.
 *
 * Loads the persisted nav-tab setting once on mount (the settings service
 * swallows auth/network failures), exposes an optimistic `setNavTab` that
 * writes through, and reports a human message when the write failed so the
 * header can toast it while keeping the in-session selection.
 */
export interface UseSettingsResult {
  navTab: NavTabId;
  source: PreferenceSource;
  ready: boolean;
  saveError: string | null;
  setNavTab: (tab: NavTabId) => void;
  dismissSaveError: () => void;
}

const SAVE_ERROR_MESSAGE =
  "Your tab preference could not be saved. It will still work for this session.";

export function useSettings(): UseSettingsResult {
  const [navTab, setNavTabState] = useState<NavTabId>(
    DEFAULT_DONOR_PREFERENCES.navTab,
  );
  const [source, setSource] = useState<PreferenceSource>("default");
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    void (async () => {
      const snapshot = await getNavTabSetting();
      if (cancelled || !mountedRef.current) return;
      setNavTabState(snapshot.navTab);
      setSource(snapshot.source);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, []);

  const setNavTab = useCallback((tab: NavTabId) => {
    // Optimistic: the tab always switches in-session, even if saving fails.
    setNavTabState(tab);
    setSaveError(null);

    void (async () => {
      const result = await setNavTabSetting(tab);
      if (!mountedRef.current) return;
      setSource(result.source);
      if (!result.ok) setSaveError(SAVE_ERROR_MESSAGE);
    })();
  }, []);

  const dismissSaveError = useCallback(() => setSaveError(null), []);

  return { navTab, source, ready, saveError, setNavTab, dismissSaveError };
}

/** Alias kept for call sites that name the setting explicitly. */
export const useNavTabSetting = useSettings;

export default useSettings;
