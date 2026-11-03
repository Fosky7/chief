/**
 * Database mirror for the donor's giving ledger and swipe session.
 *
 * The browser copy stays the source the app reads instantly, so every page
 * keeps working signed out or offline. When a donor is signed in, each save is
 * also written to the database (`public.contributions`, `public.swipe_sessions`)
 * and read back on the next visit, so their history follows them across
 * devices. Every call is best-effort: a failure never breaks the page.
 */
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export const CONTRIBUTIONS_TABLE = "contributions" as const;
export const SWIPE_SESSIONS_TABLE = "swipe_sessions" as const;

const isBrowser = () => typeof window !== "undefined";

async function signedInUserId(): Promise<string | null> {
  if (!isBrowser() || !isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

type LedgerEntry = {
  id: string;
  recipientName: string;
  amount: number;
  billerName?: string;
  category?: string;
  recipientSlug?: string;
  createdAt: string;
  source?: string;
};

/** Save every ledger entry for the signed-in donor (upsert by id). */
export async function pushContributionsToCloud(list: readonly LedgerEntry[]): Promise<void> {
  const userId = await signedInUserId();
  if (!userId || list.length === 0) return;
  try {
    await supabase.from(CONTRIBUTIONS_TABLE).upsert(
      list.map((c) => ({
        user_id: userId,
        id: c.id,
        recipient_name: c.recipientName,
        amount: Math.round(c.amount),
        biller_name: c.billerName ?? null,
        category: c.category ?? null,
        recipient_slug: c.recipientSlug ?? null,
        source: c.source ?? null,
        created_at: c.createdAt,
      })),
      { onConflict: "user_id,id" },
    );
  } catch {
    // Offline or not yet set up — the browser copy still has it.
  }
}

/** The signed-in donor's saved ledger, or null when unavailable. */
export async function pullContributionsFromCloud(): Promise<LedgerEntry[] | null> {
  const userId = await signedInUserId();
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from(CONTRIBUTIONS_TABLE)
      .select("id, recipient_name, amount, biller_name, category, recipient_slug, source, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error || !data) return null;
    return data.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      recipientName: String(r.recipient_name ?? ""),
      amount: Number(r.amount ?? 0),
      billerName: (r.biller_name as string | null) ?? undefined,
      category: (r.category as string | null) ?? undefined,
      recipientSlug: (r.recipient_slug as string | null) ?? undefined,
      source: (r.source as string | null) ?? undefined,
      createdAt: String(r.created_at ?? new Date().toISOString()),
    }));
  } catch {
    return null;
  }
}

/** Save the current swipe session for the signed-in donor. */
export async function saveSwipeSessionToCloud(state: unknown): Promise<void> {
  const userId = await signedInUserId();
  if (!userId) return;
  try {
    await supabase
      .from(SWIPE_SESSIONS_TABLE)
      .upsert({ user_id: userId, state, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  } catch {
    // Offline — the browser copy still has it.
  }
}

/** The saved session as a JSON string (for the existing validator), or null. */
export async function loadSwipeSessionFromCloud(): Promise<string | null> {
  const userId = await signedInUserId();
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from(SWIPE_SESSIONS_TABLE)
      .select("state")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data?.state) return null;
    return JSON.stringify(data.state);
  } catch {
    return null;
  }
}
