import { useSyncExternalStore } from "react";

import {
  DEFAULT_PREFERENCES,
  getSettingsServerSnapshot,
  getSettingsSnapshot,
  resetSettings,
  subscribeSettings,
  updateSettings,
  type DonorPreferences,
} from "@/services/settings";

/**
 * Read the donor's settings store.
 *
 * `useSyncExternalStore` keeps every consumer (settings page today, the swipe
 * deck / notification surfaces later) in sync with the persisted preferences,
 * including changes made in another tab.
 */
export type UseSettingsResult = {
  preferences: DonorPreferences;
  updatePreferences: (patch: Partial<DonorPreferences>) => DonorPreferences;
  resetPreferences: () => DonorPreferences;
  defaults: DonorPreferences;
};

export function useSettings(): UseSettingsResult {
  const preferences = useSyncExternalStore(
    subscribeSettings,
    getSettingsSnapshot,
    getSettingsServerSnapshot,
  );

  return {
    preferences,
    updatePreferences: updateSettings,
    resetPreferences: resetSettings,
    defaults: DEFAULT_PREFERENCES,
  };
}

export default useSettings;
