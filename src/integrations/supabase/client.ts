import { createClient } from "@supabase/supabase-js";

/**
 * Single shared Supabase client for the whole app.
 *
 * Configuration comes from the build environment:
 *   - VITE_SUPABASE_URL
 *   - VITE_SUPABASE_PUBLISHABLE_KEY (preferred) or VITE_SUPABASE_ANON_KEY
 *
 * If either value is missing we log a loud, actionable error instead of
 * throwing at import time — throwing here would blank every page, including
 * the public welcome page. Auth calls will simply fail and the UI surfaces
 * its normal error states.
 */
const env = import.meta.env as Record<string, string | undefined>;

const supabaseUrl = env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "").trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.error(
    "[Chief] Missing backend configuration: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) in the build environment.",
  );
}

const browserStorage =
  typeof window !== "undefined" && typeof window.localStorage !== "undefined" ? window.localStorage : undefined;

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://unconfigured.invalid",
  isSupabaseConfigured ? supabaseKey : "unconfigured-public-key",
  {
    auth: {
      storage: browserStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
