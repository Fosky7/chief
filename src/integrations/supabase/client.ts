import { createClient } from "@supabase/supabase-js";

// VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are injected by the
// platform at build time. Never hardcode credentials here.
const env = import.meta.env as unknown as Record<string, string | undefined>;

const supabaseUrl = env.VITE_SUPABASE_URL ?? "";
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: typeof window === "undefined" ? undefined : window.localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
