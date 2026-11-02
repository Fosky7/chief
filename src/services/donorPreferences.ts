/**
 * Donor preferences store (Module 10 — Settings).
 *
 * Module-scope store persisted to `localStorage` under
 * `chief:preferences:v1`, following the exact shape of the existing session
 * store: a stable snapshot plus `subscribe`/`getSnapshot` so consumers can use
 * `useSyncExternalStore` without tearing.
 *
 * Guarantees:
 * - Lazy hydration: nothing is read until the first `getSnapshot()` /
 *   `subscribe()` call, so importing this module during SSR is safe.
 * - Defensive I/O: every read/write is wrapped in try/catch and guards
 *   `typeof window`, so private mode (or a disabled store) degrades to an
 *   in-memory store instead of throwing.
 * - Cross-tab consistency: a `storage` event from another tab replaces the
 *   snapshot and notifies listeners.
 * - `clearSwipeSession()` removes only swipe-session keys — the giving ledger
 *   is never touched.
 */

import {
  DEFAULT_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  SWIPE_SESSION_KEY_PREFIX,
  SWIPE_SESSION_STORAGE_KEY,
  clampDisplayName,
  isPreferredAmount,
  normaliseDisplayName,
  type DonorPreferences,
  type NotificationKey,
  type PreferredAmount,
} from "@/types/preferences";

type Listener = () => void;

/** Active listeners (one per subscribed component / hook instance). */
const listeners = new Set<Listener>();

/**
 * The current snapshot. `null` means "not hydrated yet" — the first read
 * hydrates from storage. Once hydrated, the reference only changes on a real
 * mutation, which is exactly what `useSyncExternalStore` requires.
 */
let snapshot: DonorPreferences | null = null;

/** The window `storage` listener is attached at most once per document. */
let storageListenerAttached = false;

/* -------------------------------------------------------------------------- */
/* Storage access                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Resolve `localStorage`, returning `null` on the server or when the browser
 * blocks storage access (Safari private mode, hardened cookie settings, …).
 */
function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Coerce an untrusted value into a boolean, falling back to `fallback`. */
function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Merge an arbitrary parsed value over the defaults, validating field by
 * field. A corrupted — or partially written — record therefore still yields a
 * usable `DonorPreferences` instead of throwing.
 */
function sanitisePreferences(raw: unknown): DonorPreferences {
  if (typeof raw !== "object" || raw === null) {
    return { ...DEFAULT_PREFERENCES };
  }

  const source = raw as Partial<Record<keyof DonorPreferences, unknown>>;

  const displayName =
    typeof source.displayName === "string"
      ? normaliseDisplayName(source.displayName)
      : DEFAULT_PREFERENCES.displayName;

  const preferredAmount: PreferredAmount = isPreferredAmount(source.preferredAmount)
    ? source.preferredAmount
    : DEFAULT_PREFERENCES.preferredAmount;

  return {
    displayName,
    preferredAmount,
    notifyOnVerifiedRequest: readBoolean(
      source.notifyOnVerifiedRequest,
      DEFAULT_PREFERENCES.notifyOnVerifiedRequest,
    ),
    notifyOnPayment: readBoolean(
      source.notifyOnPayment,
      DEFAULT_PREFERENCES.notifyOnPayment,
    ),
    reduceMotion: readBoolean(source.reduceMotion, DEFAULT_PREFERENCES.reduceMotion),
    anonymousGiving: readBoolean(
      source.anonymousGiving,
      DEFAULT_PREFERENCES.anonymousGiving,
    ),
  };
}

/** Read (and validate) the persisted preferences, or return the defaults. */
function readStoredPreferences(): DonorPreferences {
  const storage = getStorage();
  if (!storage) return { ...DEFAULT_PREFERENCES };

  try {
    const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return sanitisePreferences(JSON.parse(raw) as unknown);
  } catch {
    // Corrupt JSON, blocked storage, quota errors — fall back to defaults.
    return { ...DEFAULT_PREFERENCES };
  }
}

/** Persist the snapshot, silently falling back to in-memory on failure. */
function persistPreferences(next: DonorPreferences): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota exceeded: the in-memory snapshot stays authoritative
    // for this tab, which is the best available fallback.
  }
}

/* -------------------------------------------------------------------------- */
/* Change notification                                                        */
/* -------------------------------------------------------------------------- */

/** Fan out a change to every subscriber, isolating listener failures. */
function notifyListeners(): void {
  // Copy first so a listener that unsubscribes mid-flush is safe.
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch (error) {
      // A broken consumer must never take the store down with it.
      console.error("[donorPreferences] listener failed", error);
    }
  }
}

/** Shallow equality across every preference field. */
function arePreferencesEqual(a: DonorPreferences, b: DonorPreferences): boolean {
  return (
    a.displayName === b.displayName &&
    a.preferredAmount === b.preferredAmount &&
    a.notifyOnVerifiedRequest === b.notifyOnVerifiedRequest &&
    a.notifyOnPayment === b.notifyOnPayment &&
    a.reduceMotion === b.reduceMotion &&
    a.anonymousGiving === b.anonymousGiving
  );
}

/**
 * Re-read preferences written by another tab. Uses the event's key filter so
 * unrelated writes (including the giving ledger) never re-render the page.
 */
function handleStorageEvent(event: StorageEvent): void {
  // `key === null` means the whole store was cleared — always re-sync.
  if (event.key !== null && event.key !== PREFERENCES_STORAGE_KEY) return;

  const current = ensureSnapshot();
  const next = readStoredPreferences();
  if (arePreferencesEqual(current, next)) return;

  snapshot = next;
  notifyListeners();
}

/** Attach the cross-tab listener once, in the browser only. */
function attachStorageListener(): void {
  if (storageListenerAttached) return;
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return;
  }

  window.addEventListener("storage", handleStorageEvent);
  storageListenerAttached = true;
}

/* -------------------------------------------------------------------------- */
/* Snapshot management                                                        */
/* -------------------------------------------------------------------------- */

/** Hydrate on first use and return the stable snapshot reference. */
function ensureSnapshot(): DonorPreferences {
  if (snapshot === null) {
    snapshot = readStoredPreferences();
  }
  return snapshot;
}

/** Write the next snapshot, persist it and notify every subscriber. */
function commit(next: DonorPreferences): void {
  snapshot = next;
  persistPreferences(next);
  notifyListeners();
}

/* -------------------------------------------------------------------------- */
/* Public store API                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Current preferences. Returns the same object reference until something
 * actually changes, so it is safe to pass straight to `useSyncExternalStore`.
 */
export function getSnapshot(): DonorPreferences {
  return ensureSnapshot();
}

/**
 * Server/SSR snapshot. Also used as the first paint on the client before
 * hydration, so it must be a stable reference (it is — a frozen constant).
 */
export function getServerSnapshot(): DonorPreferences {
  return DEFAULT_PREFERENCES;
}

/** Subscribe to preference changes. Returns the unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  attachStorageListener();
  // Hydrate now so the very first render already sees persisted values.
  ensureSnapshot();

  return () => {
    listeners.delete(listener);
  };
}

/** Set (or clear, with an empty string) the donor's greeting name. */
export function setDisplayName(name: string): void {
  const current = ensureSnapshot();
  const displayName = clampDisplayName(typeof name === "string" ? name : "");
  if (displayName === current.displayName) return;

  commit({ ...current, displayName });
}

/**
 * Choose the default pledge amount. Values outside the preset list are
 * ignored-safe: they fall back to the shipped default rather than corrupting
 * the store.
 */
export function setPreferredAmount(amount: number): void {
  const current = ensureSnapshot();
  const preferredAmount: PreferredAmount = isPreferredAmount(amount)
    ? amount
    : DEFAULT_PREFERENCES.preferredAmount;
  if (preferredAmount === current.preferredAmount) return;

  commit({ ...current, preferredAmount });
}

/**
 * Flip a notification toggle. Pass `value` to set it explicitly (idempotent —
 * useful for switches), or omit it to invert the current state.
 */
export function toggleNotification(key: NotificationKey, value?: boolean): void {
  const current = ensureSnapshot();
  const next = typeof value === "boolean" ? value : !current[key];
  if (next === current[key]) return;

  commit({ ...current, [key]: next });
}

/** Honour the donor's reduced-motion preference. */
export function setReduceMotion(value: boolean): void {
  const current = ensureSnapshot();
  if (current.reduceMotion === Boolean(value)) return;

  commit({ ...current, reduceMotion: Boolean(value) });
}

/** Hide (or show) the donor's name on the bills they pay. */
export function setAnonymousGiving(value: boolean): void {
  const current = ensureSnapshot();
  if (current.anonymousGiving === Boolean(value)) return;

  commit({ ...current, anonymousGiving: Boolean(value) });
}

/** Restore every preference to `DEFAULT_PREFERENCES` and drop the stored key. */
export function resetPreferences(): void {
  snapshot = { ...DEFAULT_PREFERENCES };

  const storage = getStorage();
  if (storage) {
    try {
      storage.removeItem(PREFERENCES_STORAGE_KEY);
    } catch {
      // Nothing to do — the in-memory snapshot is already reset.
    }
  }

  notifyListeners();
}

/* -------------------------------------------------------------------------- */
/* Swipe session (deck) housekeeping                                          */
/* -------------------------------------------------------------------------- */

/** True when `key` belongs to the swipe deck session, and nothing else. */
function isSwipeSessionKey(key: string): boolean {
  if (key === SWIPE_SESSION_STORAGE_KEY) return true;
  return key.toLowerCase().startsWith(SWIPE_SESSION_KEY_PREFIX);
}

/**
 * Whether a swipe session is currently stored. Imperative helper used to
 * enable/disable the "Clear swipe session" action — it deliberately does not
 * subscribe (session changes are already observed by `useSwipeSession`).
 */
export function hasSwipeSession(): boolean {
  const storage = getStorage();
  if (!storage) return false;

  try {
    if (storage.getItem(SWIPE_SESSION_STORAGE_KEY) !== null) return true;

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && isSwipeSessionKey(key)) return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Forget the local swipe session so the deck restarts at card 1.
 *
 * Only swipe-session keys are removed: the giving ledger, preferences and
 * anything else in storage are left exactly as they were. Returns `true` when
 * at least one key was removed, so the caller can pick the right message.
 */
export function clearSwipeSession(): boolean {
  const storage = getStorage();
  if (!storage) return false;

  let cleared = false;

  try {
    // Collect keys first: mutating a Storage while iterating it is unsafe.
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && isSwipeSessionKey(key)) keys.push(key);
    }

    for (const key of keys) {
      storage.removeItem(key);
      cleared = true;
    }
  } catch {
    // Blocked storage: report whatever we managed to remove.
    return cleared;
  }

  return cleared;
}
