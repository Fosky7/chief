import { useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthMode = "signin" | "signup";
export type SignUpRole = "borrower" | "lender" | "admin";
export type UserRole = "borrower" | "lender" | "admin" | "user";

export interface AuthProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: UserRole | null;
  [key: string]: unknown;
}

export interface AuthResult {
  error: string | null;
}

interface AuthSnapshot {
  session: Session | null;
  user: User | null;
  role: UserRole;
  profile: AuthProfile | null;
  loading: boolean;
  error: string | null;
  mode: AuthMode;
}

/**
 * Small module-level store so every component observes exactly one auth
 * subscription, whether or not it is nested inside <AuthProvider />.
 */
let snapshot: AuthSnapshot = {
  session: null,
  user: null,
  role: "borrower",
  profile: null,
  loading: true,
  error: null,
  mode: "signin",
};

const listeners = new Set<() => void>();
let initialised = false;

function emit(patch: Partial<AuthSnapshot>) {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function resolveRole(
  user: User | null,
): Promise<{ role: UserRole; profile: AuthProfile | null }> {
  if (!user) return { role: "borrower", profile: null };

  const metadataRole = ((user.user_metadata ?? {}) as { role?: UserRole }).role;
  const fallbackRole: UserRole = metadataRole ?? "borrower";

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) return { role: fallbackRole, profile: null };

    const row = data as AuthProfile;
    return { role: (row.role as UserRole | null) ?? fallbackRole, profile: row };
  } catch {
    return { role: fallbackRole, profile: null };
  }
}

function init() {
  if (initialised) return;
  initialised = true;

  void supabase.auth
    .getSession()
    .then(async ({ data }) => {
      const session = data.session ?? null;
      const { role, profile } = await resolveRole(session?.user ?? null);
      emit({ session, user: session?.user ?? null, role, profile, loading: false });
    })
    .catch(() => emit({ loading: false }));

  supabase.auth.onAuthStateChange((_event, session) => {
    void (async () => {
      const { role, profile } = await resolveRole(session?.user ?? null);
      emit({
        session: session ?? null,
        user: session?.user ?? null,
        role,
        profile,
        loading: false,
      });
    })();
  });
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  emit({ error: null, loading: true });
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.session) {
      const message = error?.message ?? "Invalid email or password";
      emit({ error: message, loading: false, session: null, user: null });
      return { error: message };
    }

    const { role, profile } = await resolveRole(data.session.user);
    emit({
      session: data.session,
      user: data.session.user,
      role,
      profile,
      loading: false,
      error: null,
    });
    return { error: null };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to sign in right now";
    emit({ error: message, loading: false });
    return { error: message };
  }
}

export async function signUp(
  email: string,
  password: string,
  role: SignUpRole = "borrower",
  fullName?: string,
): Promise<AuthResult> {
  emit({ error: null, loading: true });
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { role, full_name: fullName ?? "" } },
    });

    if (error) {
      emit({ error: error.message, loading: false });
      return { error: error.message };
    }

    if (data.session) {
      const { role: resolved, profile } = await resolveRole(data.session.user);
      emit({
        session: data.session,
        user: data.session.user,
        role: resolved,
        profile,
        loading: false,
        error: null,
      });
    } else {
      emit({ loading: false, error: null });
    }

    return { error: null };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to create your account";
    emit({ error: message, loading: false });
    return { error: message };
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    await supabase.auth.signOut();
    emit({
      session: null,
      user: null,
      role: "borrower",
      profile: null,
      error: null,
      loading: false,
    });
    return { error: null };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Unable to sign out";
    return { error: message };
  }
}

export async function refreshSession(): Promise<AuthResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;
    const { role, profile } = await resolveRole(session?.user ?? null);
    emit({ session, user: session?.user ?? null, role, profile, loading: false });
    return { error: null };
  } catch {
    emit({ loading: false });
    return { error: null };
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthSnapshot>(snapshot);

  useEffect(() => {
    init();
    setState(snapshot);
    return subscribe(() => setState(snapshot));
  }, []);

  const isAdmin = state.role === "admin";
  const isAuthenticated = Boolean(state.session);

  return {
    session: state.session,
    user: state.user,
    role: state.role,
    profile: state.profile,
    loading: state.loading,
    error: state.error,
    mode: state.mode,
    isAdmin,
    isAuthenticated,
    signIn,
    signInWithPassword: signIn,
    signUp,
    signUpWithPassword: signUp,
    signOut,
    logout: signOut,
    refresh: refreshSession,
    setMode: (mode: AuthMode) => emit({ mode }),
    clearError: () => emit({ error: null }),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    init();
  }, []);

  return <>{children}</>;
}

export default useAuth;
