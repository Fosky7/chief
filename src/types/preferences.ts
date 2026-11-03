/**
 * Persisted donor / header-nav preference contract.
 *
 * One shared, JSON-safe shape used by the Supabase service, the settings
 * service, the React hooks, the navigation config and the browser specs.
 * The persisted keys here ARE the `NavTabId` values the database check
 * constraint allows, so client and backend can never drift.
 */

/** Every tab the header can remember. Mirrors the DB check constraint. */
export type NavTabId = "home" | "discover" | "dashboard" | "settings";

/** Runtime list of the same ids (validation + DB constraint parity). */
export const NAV_TAB_ID_LIST: readonly NavTabId[] = [
  "home",
  "discover",
  "dashboard",
  "settings",
] as const;

/** Where the value that is currently painted came from. */
export type PreferenceSource = "supabase" | "local" | "default";

/** The persisted preference payload. */
export interface DonorPreferences {
  /** The remembered header tab. */
  navTab: NavTabId;
  /** ISO timestamp of the last write (client clock, server sets its own). */
  updatedAt: string;
  /** Owning donor when signed in; `null` for the anonymous/local path. */
  donorId?: string | null;
}

/** Fallback used whenever nothing is stored or anything fails. */
export const DEFAULT_DONOR_PREFERENCES: DonorPreferences = Object.freeze({
  navTab: "home",
  updatedAt: new Date(0).toISOString(),
  donorId: null,
}) as DonorPreferences;

/** Type guard for values coming from storage / the database. */
export function isNavTabId(value: unknown): value is NavTabId {
  return (
    typeof value === "string" &&
    (NAV_TAB_ID_LIST as readonly string[]).includes(value)
  );
}

/** Coerce anything persisted into a known tab id (defaults to `home`). */
export function coerceNavTab(
  value: unknown,
  fallback: NavTabId = DEFAULT_DONOR_PREFERENCES.navTab,
): NavTabId {
  return isNavTabId(value) ? value : fallback;
}

/* ------------------------------------------------------------------------- */
/* Settings surface (Module 10)                                               */
/*                                                                            */
/* These constants/shapes back `src/routes/settings.tsx`. They only describe  */
/* local, client-side defaults — persistence always goes through            */
/* `@/services/donorPreferences` (table `nav_preferences`).                  */
/* ------------------------------------------------------------------------- */

/**
 * Keys used for the notification toggles. Known keys are documented for
 * autocomplete while still accepting any string, so the settings surface can
 * add a toggle without a contract change.
 */
export type NotificationKey = "pledgeUpdates" | "weeklyDigest" | (string & {});

/** The donor's local settings profile. */
export interface DonorSettingsPreferences {
  /** Display name shown on the dashboard and pledge receipts. */
  displayName: string;
  /** Preferred pledge amount preset, in NGN. */
  preferredAmount: number;
  /** Hide the donor's name on public pledge lists. */
  anonymous: boolean;
  /** Per-toggle notification switches. */
  notifications: Record<NotificationKey, boolean>;
  /** Augments (never overrides) the OS reduced-motion hint. */
  reducedMotion: boolean;
  /** Locked to NGN until multi-currency gets a backend. */
  currency: "NGN";
}

/** Longest display name the settings form accepts. */
export const MAX_DISPLAY_NAME_LENGTH = 40;

/** Trim a display name and cut it to the maximum length. */
export function clampDisplayName(value: string): string {
  if (typeof value !== "string") return "";
  return value.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

/** Selectable pledge amount presets (NGN). */
export const AMOUNT_PRESET_OPTIONS: ReadonlyArray<{
  value: number;
  label: string;
}> = [
  { value: 500, label: "₦500" },
  { value: 1000, label: "₦1,000" },
  { value: 2500, label: "₦2,500" },
  { value: 5000, label: "₦5,000" },
  { value: 10000, label: "₦10,000" },
] as const;

/** Factory defaults for the settings surface. */
export const DEFAULT_PREFERENCES: DonorSettingsPreferences = Object.freeze({
  displayName: "",
  preferredAmount: 1000,
  anonymous: false,
  notifications: {
    pledgeUpdates: true,
    weeklyDigest: false,
  },
  reducedMotion: false,
  currency: "NGN",
}) as DonorSettingsPreferences;

/** Key that stores the last swipe-deck session. */
export const SWIPE_SESSION_STORAGE_KEY = "chief:swipe-session";

/** Prefix shared by every swipe-deck session key. */
export const SWIPE_SESSION_KEY_PREFIX = "chief:swipe";
