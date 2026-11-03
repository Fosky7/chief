import { supabase } from '@/integrations/supabase/client';
import {
  NAV_PREFERENCES_COLUMNS,
  NAV_PREFERENCES_CONFLICT_TARGET,
  NAV_PREFERENCES_SELECT,
  NAV_PREFERENCES_STORAGE_FALLBACK_KEY,
  NAV_PREFERENCES_TABLE,
} from '@/integrations/supabase/contracts';
import type { NavPreferencesRow } from '@/integrations/supabase/contracts';
import type { NavTabId } from '@/types/nav';

/**
 * Header/nav preference persistence.
 *
 * - Signed in: the selection round-trips through `public.nav_preferences`
 *   (see `src/integrations/supabase/contracts.ts`) via the shared Supabase
 *   client, so a full reload restores it from the database.
 * - Anonymous / offline / unauthenticated: the same typed value is mirrored in
 *   `localStorage`, so the header still renders, the selection still survives a
 *   reload, and no error is surfaced.
 */

export interface NavPreferences {
  activeTab: NavTabId;
}

/** Tab used when nothing has ever been saved. */
export const DEFAULT_NAV_TAB = 'home' as unknown as NavTabId;

/** Window event used to keep every mounted header surface in step. */
export const NAV_PREFERENCE_EVENT = 'chief:nav-preference-change';

/** localStorage mirror (shared with the contract module). */
export const NAV_PREFERENCE_STORAGE_KEY = NAV_PREFERENCES_STORAGE_FALLBACK_KEY;

/** Every tab id the contract recognises. */
export const NAV_TAB_IDS = [
  'home',
  'discover',
  'recipients',
  'dashboard',
  'settings',
] as const;

export function isNavTabId(value: unknown): value is NavTabId {
  return (
    typeof value === 'string' &&
    (NAV_TAB_IDS as ReadonlyArray<string>).includes(value)
  );
}

function readLocal(): NavTabId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(NAV_PREFERENCE_STORAGE_KEY);
    if (!raw) return null;
    if (isNavTabId(raw)) return raw;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'string' && isNavTabId(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') {
      const candidate = (parsed as { activeTab?: unknown; active_tab?: unknown })
        .activeTab ?? (parsed as { active_tab?: unknown }).active_tab;
      if (isNavTabId(candidate)) return candidate;
    }
    return null;
  } catch {
    return null;
  }
}

function writeLocal(tab: NavTabId): void {
  if (typeof window === 'undefined') return;
  // Throws only on a real storage failure (private mode / quota); callers treat
  // that as the single unrecoverable case and revert.
  window.localStorage.setItem(NAV_PREFERENCE_STORAGE_KEY, tab);
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Load the saved tab. Never throws: a missing session, an unreachable backend
 * or a denied RLS read all fall back to the localStorage mirror and finally to
 * `DEFAULT_NAV_TAB`.
 */
export async function loadNavPreferences(): Promise<NavPreferences> {
  const local = readLocal();
  const fallback: NavPreferences = { activeTab: local ?? DEFAULT_NAV_TAB };

  const userId = await currentUserId();
  if (!userId) return fallback;

  try {
    // The generated Database types may not include this table yet; the contract
    // constants above are the single source of truth for the names.
    const { data, error } = await (supabase as any)
      .from(NAV_PREFERENCES_TABLE)
      .select(NAV_PREFERENCES_SELECT)
      .eq(NAV_PREFERENCES_COLUMNS.userId, userId)
      .maybeSingle();

    if (error) return fallback;

    const row = data as Partial<NavPreferencesRow> | null;
    const persisted = row?.[NAV_PREFERENCES_COLUMNS.activeTab];
    if (!isNavTabId(persisted)) return fallback;

    // Keep the offline mirror warm so a later offline reload restores it.
    try {
      writeLocal(persisted);
    } catch {
      /* non fatal */
    }

    return { activeTab: persisted };
  } catch {
    return fallback;
  }
}

/**
 * Persist the chosen tab.
 *
 * The localStorage mirror is written first, so the value survives a reload even
 * when the backend is unreachable. The Supabase upsert is best-effort: a
 * network/RLS failure is logged but not rethrown, so the header never shows an
 * error toast for a transient outage (the local mirror is authoritative then).
 * Only a genuine local storage failure rejects, which lets the hook revert.
 */
export async function saveNavPreferences(tab: NavTabId): Promise<void> {
  if (!isNavTabId(tab)) throw new Error('Unknown navigation tab');

  writeLocal(tab);

  const userId = await currentUserId();
  if (!userId) return;

  try {
    const payload = {
      [NAV_PREFERENCES_COLUMNS.userId]: userId,
      [NAV_PREFERENCES_COLUMNS.activeTab]: tab,
    };

    const { error } = await (supabase as any)
      .from(NAV_PREFERENCES_TABLE)
      .upsert(payload, { onConflict: NAV_PREFERENCES_CONFLICT_TARGET });

    if (error) {
      // eslint-disable-next-line no-console
      console.warn(
        `nav preferences: could not persist to ${NAV_PREFERENCES_TABLE}; kept local mirror`,
        error.message,
      );
    }
  } catch (cause) {
    // eslint-disable-next-line no-console
    console.warn('nav preferences: backend unreachable; kept local mirror', cause);
  }
}

/** Clear the stored preference (used by tests / reset flows). */
export async function clearNavPreferences(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(NAV_PREFERENCE_STORAGE_KEY);
    } catch {
      /* non fatal */
    }
  }

  const userId = await currentUserId();
  if (!userId) return;

  try {
    await (supabase as any)
      .from(NAV_PREFERENCES_TABLE)
      .delete()
      .eq(NAV_PREFERENCES_COLUMNS.userId, userId);
  } catch {
    /* non fatal */
  }
}
