import { createClient } from "@supabase/supabase-js";

// Single shared Supabase client for the whole app.
// Reads public (browser-safe) config only — never put service-role keys here.
const env = import.meta.env as Record<string, string | undefined>;

const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "";
const SUPABASE_KEY =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

if (!isSupabaseConfigured && typeof console !== "undefined") {
  console.warn(
    "[Chief] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

// Fallback values keep the app from crashing at import time when env is missing;
// requests will simply fail with a clear network error instead.
export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_KEY || "public-anon-key-missing",
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
