/**
 * Chief database module — the one place that knows Chief's tables.
 *
 * Tables (see supabase/migrations/):
 *   public.contributions    the donor's pledge ledger (amount in whole Naira)
 *   public.swipe_sessions   the donor's swipe-deck progress
 *   public.donor_settings   display name, preferred pledge amount, privacy…
 *   public.nav_preferences  the remembered header tab
 *
 * The browser copy is always written first so Chief works signed out and
 * offline; when a donor is signed in, every save is mirrored here and read
 * back on the next visit, so data survives a refresh and follows the donor
 * across devices. Nothing in this module throws.
 */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export {
  CONTRIBUTIONS_TABLE,
  SWIPE_SESSIONS_TABLE,
  pushContributionsToCloud,
  pullContributionsFromCloud,
  saveSwipeSessionToCloud,
  loadSwipeSessionFromCloud,
} from "@/services/cloudSync";

export const DONOR_SETTINGS_TABLE = "donor_settings" as const;

export interface DonorSettingsRow {
  display_name: string;
  preferred_amount: number;
  anonymous: boolean;
  notifications: Record<string, boolean>;
  reduced_motion: boolean;
  currency: string;
  updated_at?: string;
}

export async function currentDonorId(): Promise<string | null> {
  if (typeof window === "undefined" || !isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** The signed-in donor's saved settings, or null. */
export async function loadDonorSettingsFromCloud(): Promise<DonorSettingsRow | null> {
  const userId = await currentDonorId();
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from(DONOR_SETTINGS_TABLE)
      .select("display_name, preferred_amount, anonymous, notifications, reduced_motion, currency, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as DonorSettingsRow;
  } catch {
    return null;
  }
}

/** Save settings for the signed-in donor. Returns true when stored. */
export async function saveDonorSettingsToCloud(row: DonorSettingsRow): Promise<boolean> {
  const userId = await currentDonorId();
  if (!userId) return false;
  try {
    const { error } = await supabase
      .from(DONOR_SETTINGS_TABLE)
      .upsert({ ...row, user_id: userId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    return !error;
  } catch {
    return false;
  }
}
