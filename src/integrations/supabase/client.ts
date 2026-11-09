import { createClient } from "@supabase/supabase-js";

const env = (((import.meta as unknown as { env?: Record<string, string | undefined> }).env) ?? {}) as Record<
  string,
  string | undefined
>;

const supabaseUrl = env.VITE_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseKey =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  env.VITE_SUPABASE_ANON_KEY ??
  "public-anon-key-placeholder";

/**
 * Single shared Supabase client for the whole app.
 * The publishable key is injected at build time; when it is absent the client
 * is still created so the UI renders (auth calls simply fail gracefully).
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY),
);

export default supabase;
