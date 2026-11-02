/**
 * React binding for the donor preferences store (Module 10 — Settings).
 *
 * `useSyncExternalStore` keeps every component in sync with the persisted
 * store (including changes made in another tab). The returned shape is
 * `{ preferences, actions }`:
 *
 * - `preferences` is the store snapshot — a stable reference between real
 *   changes, so it is safe to use in dependency arrays.
 * - `actions` is a frozen, module-scope object of stable functions, so passing
 *   it into effects or child props never causes a re-render loop.
 */

import { useMemo, useSyncExternalStore } from "react";

import {
  clearSwipeSession,
  getServerSnapshot,
  getSnapshot,
  hasSwipeSession,
  resetPreferences,
  setAnonymousGiving,
  setDisplayName,
  setPreferredAmount,
  setReduceMotion,
  subscribe,
  toggleNotification,
} from "@/services/donorPreferences";
import type { DonorPreferences, NotificationKey } from "@/types/preferences";

/** Imperative mutations exposed to consumers. */
export interface DonorPreferencesActions {
  /** Set (or clear, with `""`) the greeting name. */
  setDisplayName: (name: string) => void;
  /** Choose the default pledge amount — must be one of the presets. */
  setPreferredAmount: (amount: number) => void;
  /** Flip a notification toggle, or set it explicitly with the second arg. */
  toggleNotification: (key: NotificationKey, value?: boolean) => void;
  /** Toggle the reduced-motion / calm-transitions preference. */
  setReduceMotion: (value: boolean) => void;
  /** Hide the donor's name on the bills they pay. */
  setAnonymousGiving: (value: boolean) => void;
  /** Restore every preference to its default. */
  resetPreferences: () => void;
  /** Forget the local swipe session. Returns `true` if anything was removed. */
  clearSwipeSession: () => boolean;
  /** Whether a swipe session is stored right now (imperative read). */
  hasSwipeSession: () => boolean;
}

/**
 * Module-scope actions: created once, frozen, and therefore referentially
 * stable for the lifetime of the app. No `useMemo` needed at call sites.
 */
const actions: DonorPreferencesActions = Object.freeze({
  setDisplayName,
  setPreferredAmount,
  toggleNotification,
  setReduceMotion,
  setAnonymousGiving,
  resetPreferences,
  clearSwipeSession,
  hasSwipeSession,
});

/** Result shape returned by {@link useDonorPreferences}. */
export interface UseDonorPreferencesResult {
  preferences: DonorPreferences;
  actions: DonorPreferencesActions;
}

/**
 * Read the donor's preferences and the actions that mutate them.
 *
 * ```tsx
 * const { preferences, actions } = useDonorPreferences();
 * <input
 *   value={preferences.displayName}
 *   onChange={(event) => actions.setDisplayName(event.target.value)}
 * />;
 * ```
 */
export function useDonorPreferences(): UseDonorPreferencesResult {
  const preferences = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // `actions` is already stable; memoising the wrapper keeps the returned
  // object stable too, so consumers can spread it into props safely.
  return useMemo(() => ({ preferences, actions }), [preferences]);
}

export default useDonorPreferences;
