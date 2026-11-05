import {
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthMode = "signIn" | "signUp";
export type SignUpRole = "donor" | "bill_requester";
export type AccountRole = SignUpRole | "admin";

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpInput extends Credentials {
  role: SignUpRole;
}

interface AuthSnapshot {
  session: Session | null;
  user: User | null;
  role: AccountRole | null;
  loading: boolean;
}

/*
 * Auth state lives in a module-level store so that `useAuth` works whether
 * or not the app is wrapped in <AuthProvider>. The provider is kept for
 * backwards compatibility with layouts that already render it.
 */
let snapshot: AuthSnapshot = {
  session: null,
  user: null,
  role: null,
  loading: true,
};
const listeners = new Set<() => void>();
let initialised = false;

const SERVER_SNAPSHOT: AuthSnapshot = {
  session: null,
  user: null,
  role: null,
  loading: true,
};

function readRole(user: User | null): AccountRole | null {
  if (!user) return null;
  const raw = (user.app_metadata?.role ?? user.user_metadata?.role) as
    | string
    | undefined;
  if (raw === "admin" || raw === "donor" || raw === "bill_requester") {
    return raw;
  }
  return "donor";
}

function setSession(session: Session | null) {
  const user = session?.user ?? null;
  snapshot = { session, user, role: readRole(user), loading: false };
  listeners.forEach((listener) => listener());
}

function init() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;

  supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  supabase.auth
    .getSession()
    .then(({ data }) => setSession(data.session))
    .catch(() => setSession(null));
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

async function signIn({ email, password }: Credentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error("Invalid login credentials");
  setSession(data.session);
  return data;
}

async function signUp({ email, password, role }: SignUpInput) {
  const redirectTo =
    typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: { role },
    },
  });
  if (error) throw new Error(error.message);
  if (data.session) setSession(data.session);
  return data;
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  setSession(null);
  if (error) throw new Error(error.message);
}

export function useAuth() {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );

  useEffect(() => {
    init();
  }, []);

  return {
    ...state,
    isAuthenticated: Boolean(state.user),
    isAdmin: state.role === "admin",
    signIn,
    signUp,
    signOut,
  };
}

export type AuthContextValue = ReturnType<typeof useAuth>;

/** Optional wrapper — kept so existing layouts that render it keep working. */
export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    init();
  }, []);
  return <>{children}</>;
}

export default useAuth;
