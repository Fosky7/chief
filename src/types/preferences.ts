/**
 * Donor preference types and constants (Module 10 — Settings).
 *
 * One source of truth for what a signed-in donor can shape about Chief: the
 * name they are greeted with, the pledge amount they reach for by default,
 * which notifications they want, and two privacy/accessibility toggles.
 *
 * Every monetary value here is NGN — the app never deals in any other
 * currency. This file holds data only: no React, no browser APIs.
 */

/** The pledge amounts offered as one-tap presets, in Naira. */
export const PREFERRED_AMOUNT_PRESETS = [500, 1000, 2500, 5000] as const;

/** Union of the allowed preset amounts (₦500 | ₦1,000 | ₦2,500 | ₦5,000). */
export type PreferredAmount = (typeof PREFERRED_AMOUNT_PRESETS)[number];

/** The shape persisted under `chief:preferences:v1`. */
export interface DonorPreferences {
  /** Optional greeting name. Empty string means "no name set". */
  displayName: string;
  /** Default pledge amount, always one of `PREFERRED_AMOUNT_PRESETS`. */
  preferredAmount: PreferredAmount;
  /** Ping me when a new verified request enters the queue. */
  notifyOnVerifiedRequest: boolean;
  /** Ping me when a bill I backed is paid by the provider. */
  notifyOnPayment: boolean;
  /** Prefer calm transitions (honour a reduced-motion preference). */
  reduceMotion: boolean;
  /** Hide my name from the recipients whose bills I pay. */
  anonymousGiving: boolean;
}

/** The booleans that can be flipped through `toggleNotification`. */
export type NotificationKey = Extract<
  keyof DonorPreferences,
  "notifyOnVerifiedRequest" | "notifyOnPayment"
>;

/** localStorage key holding the donor's preferences. */
export const PREFERENCES_STORAGE_KEY = "chief:preferences:v1";

/**
 * localStorage key holding the swipe deck session.
 *
 * The session store (`src/services/swipeSession.ts`) owns this key; the
 * settings page may remove it, but nothing here ever writes to it — and
 * nothing here touches the giving ledger.
 */
export const SWIPE_SESSION_STORAGE_KEY = "chief:swipe-session:v1";

/**
 * Prefix shared by every swipe-session key variant.
 *
 * Used as a safety net so "Clear swipe session" still works if the session
 * key is ever renamed or versioned up. It is deliberately narrow: the giving
 * ledger uses a `chief:contributions…` key and can never match.
 */
export const SWIPE_SESSION_KEY_PREFIX = "chief:swipe";

/** Upper bound for a display name so a greeting never breaks the layout. */
export const MAX_DISPLAY_NAME_LENGTH = 40;

/**
 * Defaults applied before the donor changes anything, and restored by
 * `resetPreferences()`. Notification defaults are on — the copy on the
 * settings page explains that they are in-app only.
 */
export const DEFAULT_PREFERENCES: DonorPreferences = Object.freeze({
  displayName: "",
  preferredAmount: 1000,
  notifyOnVerifiedRequest: true,
  notifyOnPayment: true,
  reduceMotion: false,
  anonymousGiving: false,
});

/** Preset amounts paired with their NGN labels, ready for the settings UI. */
export const AMOUNT_PRESET_OPTIONS: ReadonlyArray<{
  value: PreferredAmount;
  label: string;
}> = PREFERRED_AMOUNT_PRESETS.map((value) => ({
  value,
  label: `₦${value.toLocaleString("en-NG")}`,
}));

/**
 * Type guard for a value read from storage (or from any other untrusted
 * source). Anything that is not one of the presets is rejected so the store
 * can fall back to the default.
 */
export function isPreferredAmount(value: unknown): value is PreferredAmount {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    (PREFERRED_AMOUNT_PRESETS as readonly number[]).includes(value)
  );
}

/**
 * Clamp a name as it is typed: strip line breaks/tabs (they would break the
 * layout) and cap the length, while preserving trailing spaces so a donor can
 * type "Ada Lovelace" one keystroke at a time.
 */
export function clampDisplayName(value: string): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\r\n\t]+/g, " ").slice(0, MAX_DISPLAY_NAME_LENGTH);
}

/**
 * Fully cleaned name — trimmed and single-spaced. Used when a value is read
 * back from storage and by consumers that need a display-ready string.
 */
export function normaliseDisplayName(value: string): string {
  return clampDisplayName(value).trim().replace(/\s+/g, " ");
}
