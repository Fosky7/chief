import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

/** The signed-in donor (or null). `ready` turns true once the check is done. */
export function useAuthSession(): { user: User | null; ready: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true);
      return undefined;
    }
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    void supabase.auth.getUser().then(({ data: d }) => {
      setUser(d.user ?? null);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { user, ready };
}

export async function signOutDonor(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    /* already signed out */
  }
}
