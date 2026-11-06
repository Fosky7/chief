import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthMode = "signIn" | "signUp";
export type SignUpRole = "donor" | "bill_requester";

export interface AuthProfile {
  id: string;
  role?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  [key: string]: unknown;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpInput extends Credentials {
  role: SignUpRole;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: AuthProfile | null;
  role: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Database role labels. The UI shows "Bill requester", but the database role
 * is stored as "requester" (the 'bill_requester' enum label is not valid on
 * the live database).
 */
function toDatabaseRole(role: SignUpRole): string {
  return role === "bill_requester" ? "requester" : "donor";
}

async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) return null;
    return (data as AuthProfile | null) ?? null;
  } catch {
    return null;
  }
}

/** Core auth state logic. `enabled` lets the hook stay idle when a provider exists. */
function useAuthState(enabled: boolean): AuthContextValue {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [enabled]);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    if (!userId) {
      setProfile(null);
      return;
    }
    fetchProfile(userId).then((p) => {
      if (active) setProfile(p);
    });
    return () => {
      active = false;
    };
  }, [enabled, userId]);

  const signIn = useCallback(async ({ email, password }: Credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error("Invalid login credentials");
    setSession(data.session);
  }, []);

  const signUp = useCallback(async ({ email, password, role }: SignUpInput) => {
    const emailRedirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;
    const trimmed = email.trim();

    let result = await supabase.auth.signUp({
      email: trimmed,
      password,
      options: {
        emailRedirectTo,
        data: { role: toDatabaseRole(role), account_type: role },
      },
    });

    // If a database trigger rejects the role value, retry without it so the
    // account is still created; the chosen role is preserved in account_type.
    if (result.error && /database error/i.test(result.error.message)) {
      result = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: { emailRedirectTo, data: { account_type: role } },
      });
    }

    if (result.error) throw new Error(result.error.message);
    if (result.data.session) setSession(result.data.session);
    return { needsConfirmation: !result.data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    setProfile(await fetchProfile(userId));
  }, [userId]);

  const user = session?.user ?? null;
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const role =
    (profile?.role as string | null | undefined) ??
    (typeof metadata.role === "string" ? metadata.role : null) ??
    (typeof metadata.account_type === "string" ? metadata.account_type : null);

  return useMemo(
    () => ({
      user,
      session,
      profile,
      role,
      loading,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, role, loading, signIn, signUp, signOut, refreshProfile],
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthState(true);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access auth state. Uses the nearest AuthProvider when mounted; otherwise it
 * falls back to a self-contained subscription so components work either way.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  const standalone = useAuthState(context === null);
  return context ?? standalone;
}

export default useAuth;
