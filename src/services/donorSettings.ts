/**
 * Donor settings store (Settings page).
 *
 * Browser copy first (instant, works signed out), mirrored to
 * `public.donor_settings` through the Chief database module when signed in.
 * Exposes a useSyncExternalStore-compatible surface.
 */
import {
  loadDonorSettingsFromCloud,
  saveDonorSettingsToCloud,
} from "@/services/chiefDatabase";
import {
  DEFAULT_PREFERENCES,
  clampDisplayName,
  type DonorSettingsPreferences,
} from "@/types/preferences";

export const DONOR_SETTINGS_STORAGE_KEY = "chief.donorSettings.v1";

let state: DonorSettingsPreferences = { ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications } };
let initialized = false;
const listeners = new Set<() => void>();

function normalize(raw: unknown): DonorSettingsPreferences {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const amount = Number(r.preferredAmount);
  return {
    displayName: clampDisplayName(typeof r.displayName === "string" ? r.displayName : ""),
    preferredAmount: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : DEFAULT_PREFERENCES.preferredAmount,
    anonymous: r.anonymous === true,
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...(r.notifications && typeof r.notifications === "object" ? (r.notifications as Record<string, boolean>) : {}),
    },
    reducedMotion: r.reducedMotion === true,
    currency: "NGN",
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function writeLocal() {
  try {
    window.localStorage.setItem(DONOR_SETTINGS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* memory only */
  }
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const raw = window.localStorage.getItem(DONOR_SETTINGS_STORAGE_KEY);
    if (raw) state = normalize(JSON.parse(raw));
  } catch {
    /* defaults */
  }
  void loadDonorSettingsFromCloud().then((row) => {
    if (!row) {
      // First sign-in on this account: store what this device has.
      void saveDonorSettingsToCloud(toRow(state));
      return;
    }
    state = normalize({
      displayName: row.display_name,
      preferredAmount: row.preferred_amount,
      anonymous: row.anonymous,
      notifications: row.notifications,
      reducedMotion: row.reduced_motion,
    });
    writeLocal();
    emit();
  });
}

function toRow(s: DonorSettingsPreferences) {
  return {
    display_name: s.displayName,
    preferred_amount: s.preferredAmount,
    anonymous: s.anonymous,
    notifications: s.notifications,
    reduced_motion: s.reducedMotion,
    currency: s.currency,
  };
}

export function subscribeDonorSettings(listener: () => void): () => void {
  init();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDonorSettings(): DonorSettingsPreferences {
  init();
  return state;
}

export function getServerDonorSettings(): DonorSettingsPreferences {
  return DEFAULT_PREFERENCES;
}

/** Apply a change; resolves true when it also reached the database. */
export type DonorSettingsPatch = Partial<Omit<DonorSettingsPreferences, "notifications">> & {
  notifications?: Record<string, boolean>;
};

export function updateDonorSettings(patch: DonorSettingsPatch): Promise<boolean> {
  init();
  state = normalize({ ...state, ...patch, notifications: { ...state.notifications, ...(patch.notifications ?? {}) } });
  writeLocal();
  emit();
  return saveDonorSettingsToCloud(toRow(state));
}

export function resetDonorSettings(): Promise<boolean> {
  return updateDonorSettings({ ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications } });
}
