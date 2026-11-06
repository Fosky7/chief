import { createClient } from "@supabase/supabase-js";

/**
 * Shared Supabase client.
 *
 * Required env vars:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_PUBLISHABLE_KEY (or legacy VITE_SUPABASE_ANON_KEY)
 *
 * Initialisation never throws: if configuration is missing we log a clear
 * error and fall back to an inert client so pages still render. Auth calls
 * will then fail gracefully and the UI shows its normal error messages.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL: string = (env.VITE_SUPABASE_URL ?? "").trim();
export const SUPABASE_PUBLISHABLE_KEY: string = (
  env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  env.VITE_SUPABASE_ANON_KEY ??
  ""
).trim();

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const isSupabaseConfigured: boolean =
  isValidUrl(SUPABASE_URL) && SUPABASE_PUBLISHABLE_KEY.length > 0;

export const supabaseConfigError: string | null = isSupabaseConfigured
  ? null
  : "Backend configuration missing: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).";

if (supabaseConfigError) {
  console.error(`[chief] ${supabaseConfigError}`);
}

const FALLBACK_URL = "https://placeholder.invalid.supabase.co";
const FALLBACK_KEY = "missing-publishable-key";

const browserStorage =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined"
    ? window.localStorage
    : undefined;

export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : FALLBACK_URL,
  isSupabaseConfigured ? SUPABASE_PUBLISHABLE_KEY : FALLBACK_KEY,
  {
    auth: {
      storage: browserStorage,
      persistSession: true,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: true,
    },
  },
);

export default supabase;
