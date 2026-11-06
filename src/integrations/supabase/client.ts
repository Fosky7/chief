// src/integrations/supabase/client.ts
// Single shared Supabase client for the Chief web app.
import { createClient } from "@supabase/supabase-js";

const env = import.meta.env as Record<string, string | undefined>;

const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
// Prefer the publishable key; fall back to the legacy anon key name.
const supabaseKey = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY)?.trim();

/** True when both the project URL and the public key are available to Vite. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  // Fail visibly in the console without crashing every page render.
  // Auth calls will return network errors that the UI surfaces to the visitor.
  console.error(
    "[Chief] Missing backend environment: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).",
  );
}

const hasWindow = typeof window !== "undefined";

export const supabase = createClient(
  supabaseUrl || "http://localhost:54321",
  supabaseKey || "missing-public-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: hasWindow ? window.localStorage : undefined,
    },
  },
);
