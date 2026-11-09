import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthMode = "signin" | "signup" | "sign-in" | "sign-up";
export type SignUpRole = "donor" | "sponsor" | "citizen" | "lawmaker" | string;
export type UserRole = SignUpRole | "admin";

type Creds = { email: string; password: string; role?: SignUpRole };

function toCreds(a: string | Creds, password?: string, role?: SignUpRole): Creds {
  if (typeof a === "object" && a !== null) return a;
  return { email: a, password: password ?? "", role };
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const user: User | null = session?.user ?? null;
  const role = ((user?.user_metadata as Record<string, unknown> | undefined)?.role as UserRole | undefined) ?? null;

  const signIn = useCallback(async (a: string | Creds, password?: string) => {
    const c = toCreds(a, password);
    const { data, error } = await supabase.auth.signInWithPassword({ email: c.email, password: c.password });
    return { data, error };
  }, []);

  const signUp = useCallback(async (a: string | Creds, password?: string, r?: SignUpRole) => {
    const c = toCreds(a, password, r);
    const { data, error } = await supabase.auth.signUp({
      email: c.email,
      password: c.password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
        data: c.role ? { role: c.role } : undefined,
      },
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const authenticate = useCallback(
    async (mode: AuthMode, email: string, password: string, r?: SignUpRole) =>
      mode === "signup" || mode === "sign-up" ? signUp(email, password, r) : signIn(email, password),
    [signIn, signUp],
  );

  return {
    session,
    user,
    role,
    loading,
    isLoading: loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    authenticate,
  };
}

export default useAuth;
