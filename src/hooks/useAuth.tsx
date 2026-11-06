import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Which form the /auth page is currently showing. */
export type AuthMode = "signIn" | "signUp";

/** Roles a visitor may pick when creating an account (matches backend enum). */
export type SignUpRole = "donor" | "bill_requester";

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpInput extends Credentials {
  role: SignUpRole;
}

export interface UseAuthResult {
  user: User | null;
  session: Session | null;
  role: SignUpRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

function readRole(user: User | null): SignUpRole | null {
  const value = user?.user_metadata?.role;
  return value === "donor" || value === "bill_requester" ? value : null;
}

/**
 * Auth state backed directly by the Supabase client session.
 * Every caller subscribes to Supabase auth changes, so the navigation bar,
 * the /auth page and protected pages all stay in sync without extra wiring.
 */
export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session ?? null);
      })
      .catch((error: unknown) => {
        console.error("[auth] Unable to read session", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: Credentials) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error("Invalid login credentials");
  }, []);

  const signUp = useCallback(
    async ({ email, password, role }: SignUpInput) => {
      const redirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // The profiles trigger reads this role when creating the profile row.
          data: { role },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) throw new Error(error.message);
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }, []);

  const user = session?.user ?? null;

  return {
    user,
    session,
    role: readRole(user),
    loading,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
  };
}

/**
 * Kept for compatibility with any layout that wraps the app in an auth
 * provider. Session state lives in Supabase, so this simply renders children.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default useAuth;
