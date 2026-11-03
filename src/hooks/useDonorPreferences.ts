import { useMemo } from "react";

import { useSettings } from "@/hooks/useSettings";
import {
  DEFAULT_DONOR_PREFERENCES,
  type DonorPreferences,
  type NavTabId,
  type PreferenceSource,
} from "@/types/preferences";

/**
 * Donor preferences hook — the typed view of the persisted nav tab used by the
 * header. It is a thin layer over the settings service/hook so the read path is
 * always `useDonorPreferences → useSettings → services/settings → declared
 * contract`.
 */
export interface UseDonorPreferencesResult {
  preferences: DonorPreferences;
  navTab: NavTabId;
  setNavTab: (tab: NavTabId) => void;
  ready: boolean;
  source: PreferenceSource;
  saveError: string | null;
  dismissSaveError: () => void;
}

export function useDonorPreferences(): UseDonorPreferencesResult {
  const { navTab, setNavTab, ready, source, saveError, dismissSaveError } =
    useSettings();

  const preferences = useMemo<DonorPreferences>(
    () => ({
      navTab,
      updatedAt: DEFAULT_DONOR_PREFERENCES.updatedAt,
      donorId: null,
    }),
    [navTab],
  );

  return {
    preferences,
    navTab,
    setNavTab,
    ready,
    source,
    saveError,
    dismissSaveError,
  };
}

export default useDonorPreferences;
