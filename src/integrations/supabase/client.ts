import { createClient } from "@supabase/supabase-js";

/**
 * Shared Supabase client for the whole app.
 *
 * Never throws at import time: if env vars are missing we still construct a
 * client against an unreachable placeholder so pages render, and auth calls
 * simply fail with a handled error instead of crashing the app.
 */
const env = import.meta.env as Record<string, string | undefined>;

const supabaseUrl = env.VITE_SUPABASE_URL ?? "";
const supabaseKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured && typeof console !== "undefined") {
  console.warn(
    "[Chief] Supabase environment variables are missing; account features are unavailable.",
  );
}

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured ? supabaseKey : "public-anon-key-unavailable",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
  },
);

export default supabase;
