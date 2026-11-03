import {
  DONOR_PREFERENCES_RPC,
  DONOR_PREFERENCES_STORAGE_KEY,
  DONOR_PREFERENCES_TABLE,
} from "@/integrations/supabase/contracts";
import {
  loadDonorPreferences,
  saveDonorPreferences,
} from "@/services/donorPreferences";
import {
  DEFAULT_DONOR_PREFERENCES,
  coerceNavTab,
  type DonorPreferences,
  type NavTabId,
  type PreferenceSource,
} from "@/types/preferences";

/**
 * Settings service.
 *
 * The header tab preference is a single key/value setting. Every reader goes
 * through this service (never an inline Supabase query) and it resolves via the
 * declared contract in `@/integrations/supabase/contracts`:
 * table `donor_preferences`, RPC `upsert_donor_preferences`,
 * localStorage key `chief.donorPreferences.v1`.
 */

export interface NavTabSettingSnapshot {
  navTab: NavTabId;
  source: PreferenceSource;
  preferences: DonorPreferences;
  settingKey: typeof DONOR_PREFERENCES_STORAGE_KEY;
}

export interface SaveNavTabSettingResult {
  ok: boolean;
  source: PreferenceSource;
  error?: string;
}

/** Read the persisted nav-tab setting (always resolves). */
export async function getNavTabSetting(): Promise<NavTabSettingSnapshot> {
  try {
    const { preferences, source } = await loadDonorPreferences();
    return {
      navTab: coerceNavTab(preferences.navTab),
      source,
      preferences,
      settingKey: DONOR_PREFERENCES_STORAGE_KEY,
    };
  } catch {
    return {
      navTab: DEFAULT_DONOR_PREFERENCES.navTab,
      source: "default",
      preferences: { ...DEFAULT_DONOR_PREFERENCES },
      settingKey: DONOR_PREFERENCES_STORAGE_KEY,
    };
  }
}

/** Write the nav-tab setting (always resolves; `ok` reports real failure). */
export async function setNavTabSetting(
  tab: NavTabId,
): Promise<SaveNavTabSettingResult> {
  try {
    const result = await saveDonorPreferences({
      navTab: coerceNavTab(tab),
      updatedAt: new Date().toISOString(),
      donorId: null,
    });

    return {
      ok: result.ok,
      source: result.source,
      ...(result.error ? { error: result.error } : {}),
    };
  } catch (error) {
    return {
      ok: false,
      source: "local",
      error: error instanceof Error ? error.message : "Preference not saved",
    };
  }
}

export {
  DONOR_PREFERENCES_RPC,
  DONOR_PREFERENCES_STORAGE_KEY,
  DONOR_PREFERENCES_TABLE,
};
export { DEFAULT_DONOR_PREFERENCES };
export type { DonorPreferences, NavTabId, PreferenceSource };
