import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

function readEnvironmentValue(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

const configuredSupabaseUrl = readEnvironmentValue(
  import.meta.env.VITE_SUPABASE_URL,
);
const configuredSupabasePublishableKey = readEnvironmentValue(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
) ?? readEnvironmentValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Keep public pages renderable if deployment configuration is temporarily
// unavailable. Auth and data requests can then be handled by their calling UI
// rather than crashing the application while this module is imported.
const supabaseUrl = configuredSupabaseUrl ?? "https://unconfigured.invalid";
const supabasePublishableKey =
  configuredSupabasePublishableKey ?? "unconfigured-public-key";

// This flag describes whether the shared client can be initialized safely.
// The managed backend values are used whenever injected; the inert fallback
// prevents legacy consumers from throwing before public routes can render.
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

/**
 * Shared browser client for authentication and database access.
 *
 * Only the public publishable key belongs in the client bundle. Privileged
 * service-role credentials must remain in trusted server-side environments.
 * VITE_SUPABASE_ANON_KEY remains supported for older local environments.
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
  {
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
  },
);
