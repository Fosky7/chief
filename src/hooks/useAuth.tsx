import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "donor" | "creator" | "admin";

export interface AuthResult {
  error: string | null;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    role: UserRole,
    displayName?: string,
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normaliseRole(value: unknown): UserRole | null {
  return value === "admin" || value === "creator" || value === "donor"
    ? value
    : null;
}

function useAuthState(): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    let active = true;

    if (!userId) {
      setRole(null);
      return;
    }

    supabase
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          setRole(null);
          return;
        }
        setRole(normaliseRole((data as { role?: string | null }).role));
      })
      .catch(() => {
        if (active) setRole(null);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }

  async function signUp(
    email: string,
    password: string,
    nextRole: UserRole,
    displayName?: string,
  ): Promise<AuthResult> {
    const safeRole: UserRole = nextRole === "creator" ? "creator" : "donor";
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: safeRole,
          display_name: displayName ?? email.split("@")[0],
        },
      },
    });
    return { error: error ? error.message : null };
  }

  async function signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  return {
    user: session?.user ?? null,
    session,
    role,
    loading,
    signIn,
    signUp,
    signOut,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Auth accessor. Works with or without an <AuthProvider> ancestor so existing
 * pages that call useAuth() directly keep working.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  const fallback = useAuthState();
  return context ?? fallback;
}
