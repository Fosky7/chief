import { supabase } from "@/integrations/supabase/client";

/**
 * Leaderboard data access.
 *
 * The public /leaderboard page ranks the top 100 givers by the total amount
 * they have donated. The donation/profile schemas in this project have been
 * authored incrementally, so the aggregator reads rows with `select("*")` and
 * resolves the relevant columns defensively at runtime. That keeps the page
 * working regardless of whether a deployment names the column `amount` or
 * `total_amount`, or the profile column `display_name` or `full_name`.
 */

export interface LeaderboardEntry {
  /** Stable identifier of the giver (profile / auth user id). */
  donorId: string;
  /** Human readable name, already resolved with a safe fallback. */
  name: string;
  /** Two letter avatar fallback (e.g. "AO"). */
  initials: string;
  /** Optional avatar image url. */
  avatarUrl: string | null;
  /** Sum of every donation this giver has made. */
  total: number;
  /** How many donations make up `total`. */
  donationCount: number;
}

type Row = Record<string, unknown>;

/** Tables that can hold donation rows, most likely first. */
const DONATION_TABLES = ["donations", "contributions"] as const;

const AMOUNT_KEYS = ["amount", "total_amount", "donation_amount", "gross_amount", "value"] as const;
const DONOR_KEYS = ["donor_id", "user_id", "profile_id", "giver_id", "sender_id"] as const;
const ID_KEYS = ["id", "user_id", "profile_id"] as const;
const NAME_KEYS = ["display_name", "full_name", "name", "username", "handle"] as const;
const EMAIL_KEYS = ["email", "email_address"] as const;
const AVATAR_KEYS = ["avatar_url", "avatar", "photo_url", "image_url"] as const;

/** Maximum number of rows the leaderboard renders. */
export const LEADERBOARD_SIZE = 100;

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Formats an amount as Naira, e.g. 250000 -> "₦250,000". */
export function formatAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "₦0";
  return nairaFormatter.format(amount);
}

function firstString(row: Row, keys: readonly string[]): string | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function firstNumber(row: Row, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function initialsOf(name: string): string {
  const parts = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

async function loadDonationRows(): Promise<{ rows: Row[]; error: Error | null }> {
  let lastError: Error | null = null;

  for (const table of DONATION_TABLES) {
    const { data, error } = await supabase.from(table).select("*").limit(20000);
    if (!error) {
      return { rows: (data ?? []) as Row[], error: null };
    }
    lastError = new Error(error.message);
  }

  return { rows: [], error: lastError ?? new Error("Donations could not be loaded.") };
}

async function loadProfiles(ids: string[]): Promise<Map<string, Row>> {
  const profiles = new Map<string, Row>();
  if (ids.length === 0) return profiles;

  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error || !data) return profiles;

  for (const row of data as Row[]) {
    const id = firstString(row, ID_KEYS);
    if (id) profiles.set(id, row);
  }

  return profiles;
}

/**
 * Loads and ranks givers by their lifetime donated total.
 *
 * Throws only when donations cannot be read at all, so the page can show a
 * retryable error instead of a misleading empty state.
 */
export async function fetchLeaderboard(limit: number = LEADERBOARD_SIZE): Promise<LeaderboardEntry[]> {
  const { rows, error } = await loadDonationRows();
  if (error) throw error;

  const totals = new Map<string, { total: number; donationCount: number }>();

  for (const row of rows) {
    const donorId = firstString(row, DONOR_KEYS);
    const amount = firstNumber(row, AMOUNT_KEYS);

    if (!donorId || amount === null || amount <= 0) continue;

    const current = totals.get(donorId) ?? { total: 0, donationCount: 0 };
    current.total += amount;
    current.donationCount += 1;
    totals.set(donorId, current);
  }

  const ranked = Array.from(totals.entries())
    .sort((a, b) => {
      if (b[1].total !== a[1].total) return b[1].total - a[1].total;
      // Deterministic tie-breaker so the ranking does not jump between loads.
      return a[0].localeCompare(b[0]);
    })
    .slice(0, Math.max(1, limit));

  if (ranked.length === 0) return [];

  const profiles = await loadProfiles(ranked.map(([donorId]) => donorId));

  return ranked.map(([donorId, stats]) => {
    const profile = profiles.get(donorId);
    const resolvedName =
      (profile ? firstString(profile, NAME_KEYS) ?? firstString(profile, EMAIL_KEYS) : null) ??
      "Anonymous giver";

    return {
      donorId,
      name: resolvedName,
      initials: initialsOf(resolvedName),
      avatarUrl: profile ? firstString(profile, AVATAR_KEYS) : null,
      total: stats.total,
      donationCount: stats.donationCount,
    } satisfies LeaderboardEntry;
  });
}
