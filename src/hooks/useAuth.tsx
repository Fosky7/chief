import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, SignupRole, UserRole } from "@/types";

/**
 * App-wide auth state backed by a tiny external store, so any component can
 * call useAuth() without a provider. Subscribes to Supabase once, lazily.
 */

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
}

// Untyped view of the client: the generated Database type may not yet list
// the tables created by this module's migration.
const db = supabase as unknown as SupabaseClient;

let state: AuthState = { session: null, user: null, profile: null, role: null, loading: true };
const listeners = new Set<() => void>();
let initialized = false;

function setState(patch: Partial<AuthState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

/** Metadata is user-editable, so never trust it for admin. */
function roleFromMetadata(user: User | null): UserRole | null {
  const r = user?.user_metadata?.role;
  return r === "donor" || r === "requester" ? r : user ? "donor" : null;
}

async function loadProfile(user: User) {
  const { data, error } = await db
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();
  // Ignore stale responses if the user changed meanwhile.
  if (state.user?.id !== user.id) return;
  if (!error && data) {
    const profile = data as Profile;
    setState({ profile, role: profile.role });
  }
}

function applySession(session: Session | null) {
  const user = session?.user ?? null;
  const sameUser = (state.user?.id ?? null) === (user?.id ?? null);
  setState({
    session,
    user,
    profile: sameUser ? state.profile : null,
    role: sameUser && state.profile ? state.role : roleFromMetadata(user),
    loading: false,
  });
  // Defer DB calls out of the auth callback to avoid Supabase client deadlocks.
  if (user && !sameUser) setTimeout(() => void loadProfile(user), 0);
}

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  supabase.auth
    .getSession()
    .then(({ data }) => applySession(data.session))
    .catch(() => setState({ loading: false }));
  supabase.auth.onAuthStateChange((_event, session) => applySession(session));
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

function messageOf(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}

export interface SignUpInput {
  email: string;
  password: string;
  role: SignupRole;
  fullName?: string;
}

export interface SignUpResult {
  error: string | null;
  /** True when Supabase requires email confirmation before the first sign in. */
  needsConfirmation: boolean;
}

async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: messageOf(err, "Could not sign in. Please try again.") };
  }
}

async function signUp({ email, password, role, fullName }: SignUpInput): Promise<SignUpResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { role, full_name: fullName?.trim() || null },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth` : undefined,
      },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    // Supabase returns a user with no identities when the email is already taken.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: "An account with this email already exists. Try signing in.", needsConfirmation: false };
    }
    return { error: null, needsConfirmation: !data.session };
  } catch (err) {
    return { error: messageOf(err, "Could not create your account."), needsConfirmation: false };
  }
}

async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: messageOf(err, "Could not sign out.") };
  }
}

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snapshot, signIn, signUp, signOut };
}

/** Optional compatibility wrapper; useAuth works without it. */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default useAuth;
