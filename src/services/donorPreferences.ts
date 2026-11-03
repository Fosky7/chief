import { supabase } from "@/integrations/supabase/client";
import {
  DONOR_PREFERENCES_COLUMNS,
  DONOR_PREFERENCES_RPC,
  DONOR_PREFERENCES_STORAGE_KEY,
  DONOR_PREFERENCES_TABLE,
} from "@/integrations/supabase/contracts";
import {
  DEFAULT_DONOR_PREFERENCES,
  coerceNavTab,
  type DonorPreferences,
  type NavTabId,
  type PreferenceSource,
} from "@/types/preferences";

/**
 * Donor preference persistence.
 *
 * Read path: signed-in session → `public.donor_preferences` row (declared in
 * `@/integrations/supabase/contracts`), else → the localStorage mirror, else →
 * `DEFAULT_DONOR_PREFERENCES`.
 *
 * Write path: always mirror to localStorage first (so the choice survives even
 * when the network is down), then upsert the row through the declared RPC and
 * fall back to a direct table upsert.
 *
 * Nothing in this module ever throws: every failure resolves to a value.
 */

export interface LoadDonorPreferencesResult {
  preferences: DonorPreferences;
  source: PreferenceSource;
}

export interface SaveDonorPreferencesResult {
  ok: boolean;
  preferences: DonorPreferences;
  source: PreferenceSource;
  error?: string;
}

function hasWindow(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readLocal(): DonorPreferences | null {
  if (!hasWindow()) return null;
  try {
    const raw = window.localStorage.getItem(DONOR_PREFERENCES_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown> | null;
    if (!parsed || typeof parsed !== "object") return null;

    return {
      navTab: coerceNavTab(parsed.navTab),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
      donorId: typeof parsed.donorId === "string" ? parsed.donorId : null,
    };
  } catch {
    return null;
  }
}

function writeLocal(preferences: DonorPreferences): boolean {
  if (!hasWindow()) return false;
  try {
    window.localStorage.setItem(
      DONOR_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
    return true;
  } catch {
    return false;
  }
}

async function currentUserId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data?.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Load the persisted preference (never rejects). */
export async function loadDonorPreferences(): Promise<LoadDonorPreferencesResult> {
  const local = readLocal();
  const userId = await currentUserId();

  if (userId) {
    try {
      const { data, error } = await supabase
        .from(DONOR_PREFERENCES_TABLE)
        .select(
          `${DONOR_PREFERENCES_COLUMNS.navTab}, ${DONOR_PREFERENCES_COLUMNS.updatedAt}`,
        )
        .eq(DONOR_PREFERENCES_COLUMNS.userId, userId)
        .maybeSingle();

      const row = (data ?? null) as Record<string, unknown> | null;

      if (!error && row) {
        const preferences: DonorPreferences = {
          navTab: coerceNavTab(row[DONOR_PREFERENCES_COLUMNS.navTab]),
          updatedAt:
            typeof row[DONOR_PREFERENCES_COLUMNS.updatedAt] === "string"
              ? (row[DONOR_PREFERENCES_COLUMNS.updatedAt] as string)
              : new Date().toISOString(),
          donorId: userId,
        };
        writeLocal(preferences);
        return { preferences, source: "supabase" };
      }
    } catch {
      // fall through to the local mirror / defaults
    }
  }

  if (local) return { preferences: local, source: "local" };
  return { preferences: { ...DEFAULT_DONOR_PREFERENCES }, source: "default" };
}

/** Persist the preference (never rejects). */
export async function saveDonorPreferences(
  input: DonorPreferences | NavTabId,
): Promise<SaveDonorPreferencesResult> {
  const requested: DonorPreferences =
    typeof input === "string"
      ? {
          navTab: coerceNavTab(input),
          updatedAt: new Date().toISOString(),
          donorId: null,
        }
      : {
          navTab: coerceNavTab(input.navTab),
          updatedAt: new Date().toISOString(),
          donorId: input.donorId ?? null,
        };

  // Mirror locally first so the choice survives a reload even if the write to
  // the database fails or the visitor is anonymous.
  const localOk = writeLocal(requested);

  const userId = await currentUserId();
  if (!userId) {
    return {
      ok: localOk,
      preferences: requested,
      source: "local",
      ...(localOk
        ? {}
        : { error: "Your browser blocked local storage for this site." }),
    };
  }

  try {
    // Preferred path: the declared security-invoker RPC.
    const rpc = await supabase.rpc(DONOR_PREFERENCES_RPC, {
      p_nav_tab: requested.navTab,
    });

    if (!rpc.error) {
      return {
        ok: true,
        preferences: { ...requested, donorId: userId },
        source: "supabase",
      };
    }

    // Fallback: direct table upsert against the declared table/columns.
    const direct = await supabase.from(DONOR_PREFERENCES_TABLE).upsert(
      {
        [DONOR_PREFERENCES_COLUMNS.userId]: userId,
        [DONOR_PREFERENCES_COLUMNS.navTab]: requested.navTab,
        [DONOR_PREFERENCES_COLUMNS.updatedAt]: requested.updatedAt,
      },
      { onConflict: DONOR_PREFERENCES_COLUMNS.userId },
    );

    if (!direct.error) {
      return {
        ok: true,
        preferences: { ...requested, donorId: userId },
        source: "supabase",
      };
    }

    return {
      ok: false,
      preferences: { ...requested, donorId: userId },
      source: "local",
      error: direct.error.message || rpc.error.message || "Preference not saved",
    };
  } catch (error) {
    return {
      ok: false,
      preferences: { ...requested, donorId: userId },
      source: "local",
      error:
        error instanceof Error ? error.message : "Preference not saved",
    };
  }
}

/** Convenience wrapper for the tab-only call sites. */
export function persistNavTab(
  tab: NavTabId,
): Promise<SaveDonorPreferencesResult> {
  return saveDonorPreferences(tab);
}

export { DONOR_PREFERENCES_STORAGE_KEY, DONOR_PREFERENCES_TABLE };
