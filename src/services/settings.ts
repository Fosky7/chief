/**
 * Donor preferences store (Module 10 — Settings).
 *
 * Follows the same tiny-store pattern as `src/services/swipeSession.ts`: module
 * level state persisted to `localStorage`, exposed through
 * `subscribe` / `getSnapshot` / `getServerSnapshot` so React can read it with
 * `useSyncExternalStore` (see `src/hooks/useSettings.ts`).
 *
 * Preferences are presentation + behaviour hints only — nothing here touches
 * the giving ledger.
 */

export type CurrencyCode = "NGN";

export type DonorPreferences = {
  /** Name shown on the donor's giving record. Empty means "give as a neighbour". */
  displayName: string;
  /** Pledge amount (Naira) preselected when a verified request opens. */
  preferredPledge: number;
  /** Hide the donor's name from the recipient. */
  anonymousGiving: boolean;
  /** Notify when a new verified request joins the queue. */
  notifyVerifiedRequest: boolean;
  /** Notify when a pledged bill is paid to the provider. */
  notifyPayment: boolean;
  /** Soften animations regardless of the OS setting. */
  reduceMotion: boolean;
  /** Settlement currency — NGN only until a backend can hold multi-currency balances. */
  currency: CurrencyCode;
};

export const DISPLAY_NAME_MAX_LENGTH = 40;

export const DEFAULT_PREFERENCES: DonorPreferences = {
  displayName: "",
  preferredPledge: 2500,
  anonymousGiving: false,
  notifyVerifiedRequest: true,
  notifyPayment: true,
  reduceMotion: false,
  currency: "NGN",
};

/** Pledge amounts offered in the settings select (Naira). */
export const PLEDGE_PRESETS: readonly number[] = [
  500, 1000, 2500, 5000, 10000, 25000,
];

const STORAGE_KEY = "chief.settings.v1";
const hasWindow = typeof window !== "undefined";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Normalise anything (stored JSON, a partial patch) into a complete, valid
 * preference set. Corrupt values never escape this function.
 */
export function sanitisePreferences(input: unknown): DonorPreferences {
  if (!isRecord(input)) return { ...DEFAULT_PREFERENCES };

  const displayName =
    typeof input.displayName === "string"
      ? input.displayName.replace(/\s+/g, " ").trim().slice(0, DISPLAY_NAME_MAX_LENGTH)
      : DEFAULT_PREFERENCES.displayName;

  const rawPledge =
    typeof input.preferredPledge === "number"
      ? input.preferredPledge
      : Number(input.preferredPledge);
  const preferredPledge =
    Number.isFinite(rawPledge) && rawPledge > 0
      ? Math.round(rawPledge)
      : DEFAULT_PREFERENCES.preferredPledge;

  return {
    displayName,
    preferredPledge,
    anonymousGiving: coerceBoolean(
      input.anonymousGiving,
      DEFAULT_PREFERENCES.anonymousGiving,
    ),
    notifyVerifiedRequest: coerceBoolean(
      input.notifyVerifiedRequest,
      DEFAULT_PREFERENCES.notifyVerifiedRequest,
    ),
    notifyPayment: coerceBoolean(
      input.notifyPayment,
      DEFAULT_PREFERENCES.notifyPayment,
    ),
    reduceMotion: coerceBoolean(
      input.reduceMotion,
      DEFAULT_PREFERENCES.reduceMotion,
    ),
    currency: "NGN",
  };
}

function readStoredPreferences(): DonorPreferences {
  if (!hasWindow) return { ...DEFAULT_PREFERENCES };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return sanitisePreferences(JSON.parse(raw) as unknown);
  } catch {
    // Corrupt JSON or storage blocked (private mode) — fall back to defaults.
    return { ...DEFAULT_PREFERENCES };
  }
}

let preferences: DonorPreferences = readStoredPreferences();
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of [...listeners]) {
    try {
      listener();
    } catch {
      // One broken subscriber must never block the rest of the UI.
    }
  }
}

function persistPreferences(): void {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage full or blocked — the in-memory store still works.
  }
}

/** Cross-tab sync: another tab saved preferences, so mirror them here. */
function handleStorageEvent(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  preferences = readStoredPreferences();
  emitChange();
}

export function subscribeSettings(listener: () => void): () => void {
  listeners.add(listener);

  if (hasWindow && listeners.size === 1) {
    window.addEventListener("storage", handleStorageEvent);
  }

  return () => {
    listeners.delete(listener);
    if (hasWindow && listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent);
    }
  };
}

/** Stable reference between renders — required by `useSyncExternalStore`. */
export function getSettingsSnapshot(): DonorPreferences {
  return preferences;
}

export function getSettingsServerSnapshot(): DonorPreferences {
  return DEFAULT_PREFERENCES;
}

/** Merge a partial patch into the stored preferences and notify subscribers. */
export function updateSettings(
  patch: Partial<DonorPreferences>,
): DonorPreferences {
  preferences = sanitisePreferences({ ...preferences, ...patch });
  persistPreferences();
  emitChange();
  return preferences;
}

/** Restore the Chief defaults (used by "Reset preferences"). */
export function resetSettings(): DonorPreferences {
  preferences = { ...DEFAULT_PREFERENCES };
  persistPreferences();
  emitChange();
  return preferences;
}
