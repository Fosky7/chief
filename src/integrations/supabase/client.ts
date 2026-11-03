import { createClient } from "@supabase/supabase-js";

type ViteEnv = Record<string, string | undefined>;

const meta = import.meta as unknown as { env?: ViteEnv };
const env: ViteEnv = meta.env ?? {};

export const SUPABASE_URL = env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

function resolveStorage(): Storage | undefined {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Storage can be blocked (private mode / hardened browsers). The client
    // still works for the current tab without persistence.
  }
  return undefined;
}

/**
 * The single shared Supabase client for the whole app. Always import this
 * instance: `import { supabase } from "@/integrations/supabase/client"`.
 *
 * URL and publishable key are injected at build time by the managed backend.
 * The placeholder fallback only keeps module evaluation safe when the env is
 * missing; it never replaces real injected credentials.
 */
export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_PUBLISHABLE_KEY || "public-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: resolveStorage(),
    },
  },
);

// Re-export the persistence contract constants from the canonical contract
// module so callers can import table metadata from either entry point.
export {
  NAV_PREFERENCES_TABLE,
  NAV_PREFERENCES_COLUMNS,
  NAV_PREFERENCES_POLICY,
} from "./contracts";
