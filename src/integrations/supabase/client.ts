import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

/**
 * Shared browser client for authentication and database access.
 *
 * Only the public anonymous key belongs in the client bundle. Privileged
 * service-role credentials must remain in trusted server-side environments.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "chief-auth",
  },
  global: {
    headers: {
      "X-Client-Info": "chief-web",
    },
  },
});
