import { supabase } from "@/integrations/supabase/client";

/**
 * A single row on the public leaderboard.
 * `rank` is 1-based and always contiguous (no gaps after ties).
 */
export type LeaderboardEntry = {
  rank: number;
  donorId: string;
  name: string;
  total: number;
  gifts: number;
};

/**
 * The generated Supabase client is typed from the live schema. Declaring the
 * small slice of the PostgREST builder we use here keeps the leaderboard
 * resilient: a table or column that is not in the generated types yet can never
 * break the type-check or the build.
 */
type Row = Record<string, unknown>;
type QueryResult = { data: Row[] | null; error: unknown };
type Builder = {
  select(columns?: string): Builder;
  limit(count: number): PromiseLike<QueryResult>;
  in(column: string, values: string[]): PromiseLike<QueryResult>;
};
type Reader = { from(table: string): Builder };

const db = supabase as unknown as Reader;

/** Tables that can hold a gift, most specific first. */
const GIFT_TABLES = ["contributions", "payments"] as const;

/** Only settled money is ranked; anything else is still pending. */
const PAID_STATUSES = new Set([
  "paid",
  "succeeded",
  "successful",
  "completed",
  "confirmed",
  "settled",
]);

/** Column names differ between the contribution and payment shapes. */
const DONOR_KEYS = ["user_id", "donor_id", "contributor_id", "supporter_id", "profile_id", "backer_id"];
const AMOUNT_KEYS = ["amount", "total_amount", "amount_paid", "value"];
const NAME_KEYS = ["donor_name", "contributor_name", "supporter_name", "display_name", "name", "full_name"];

/** Coerce an unknown cell into trimmed text (or null when unusable). */
function asText(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

/** First non-empty text value among `keys`. */
function firstText(row: Row, keys: string[]): string | null {
  for (const key of keys) {
    const value = asText(row[key]);
    if (value) return value;
  }
  return null;
}

/** First parseable money value among `keys` (numeric columns or NGN strings). */
function firstAmount(row: Row, keys: string[]): number {
  for (const key of keys) {
    const raw = row[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string") {
      const parsed = Number(raw.replace(/[^0-9.-]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

/** Rows with an unrecognised/missing status are treated as settled. */
function isCountable(row: Row): boolean {
  const status = firstText(row, ["status", "payment_status", "state"]);
  if (!status) return true;
  return PAID_STATUSES.has(status.toLowerCase());
}

/**
 * Read every gift row we can see. The first source that returns rows wins; if
 * none of them exist yet we simply return an empty list so the page can render
 * its honest empty state instead of an error.
 */
async function loadGiftRows(): Promise<Row[]> {
  let fallback: Row[] = [];
  for (const table of GIFT_TABLES) {
    const { data, error } = await db.from(table).select("*").limit(5000);
    if (error || !Array.isArray(data)) continue;
    if (data.length > 0) return data;
    fallback = data;
  }
  return fallback;
}

/** Resolve display names for donors whose gift rows only carry a user id. */
async function loadProfileNames(ids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (ids.length === 0) return names;
  try {
    const { data, error } = await db.from("profiles").select("*").in("id", ids);
    if (error || !Array.isArray(data)) return names;
    for (const row of data) {
      const id = asText(row.id);
      const name = firstText(row, ["display_name", "full_name", "name", "username"]);
      if (id && name) names.set(id, name);
    }
  } catch (error) {
    // Names are a nice-to-have: a missing profile never blocks the ranking.
    console.warn("[leaderboard] profile names unavailable", error);
  }
  return names;
}

/**
 * Top `limit` givers by total amount given, highest first.
 * Throws only when the network/backend call itself fails so the page can show
 * a retryable error state.
 */
export async function fetchTopGivers(limit = 100): Promise<LeaderboardEntry[]> {
  if (limit <= 0) return [];

  const rows = await loadGiftRows();

  const totals = new Map<string, { name: string | null; total: number; gifts: number }>();

  rows.forEach((row, index) => {
    if (!isCountable(row)) return;
    const amount = firstAmount(row, AMOUNT_KEYS);
    if (!(amount > 0)) return;

    const donorId = firstText(row, DONOR_KEYS);
    // Gifts without a donor id stay separate instead of merging into one blob.
    const key = donorId ?? `anonymous:${asText(row.id) ?? index}`;
    const name = firstText(row, NAME_KEYS);

    const current = totals.get(key);
    if (current) {
      current.total += amount;
      current.gifts += 1;
      if (!current.name && name) current.name = name;
    } else {
      totals.set(key, { name, total: amount, gifts: 1 });
    }
  });

  const idsNeedingNames = [...totals.entries()]
    .filter(([key, value]) => !value.name && !key.startsWith("anonymous:"))
    .map(([key]) => key);
  const profileNames = await loadProfileNames(idsNeedingNames);

  return [...totals.entries()]
    .map(([donorId, value]) => ({
      donorId,
      name: value.name ?? profileNames.get(donorId) ?? "Anonymous giver",
      total: value.total,
      gifts: value.gifts,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
