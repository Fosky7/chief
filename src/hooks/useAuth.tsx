import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, SignupRole, UserRole } from "@/types";

/**
 * App-wide auth state backed by a tiny external store, so any component can
 * call useAuth() without a provider. Subscribes to Supabase once, lazily.
 *
 * If the auth server cannot be reached at all (network failure), accounts fall
 * back to an on-device store so sign up / sign in keep working offline.
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

/* ---------------- On-device fallback (used only when offline) ---------------- */

const LOCAL_ACCOUNTS_KEY = "chief.local-accounts.v1";
const LOCAL_SESSION_KEY = "chief.local-session.v1";

interface LocalAccount {
  id: string;
  email: string;
  passwordHash: string;
  role: SignupRole;
  full_name: string | null;
  created_at: string;
}

function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function readAccounts(): Record<string, LocalAccount> {
  if (!hasStorage()) return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, LocalAccount>) : {};
  } catch {
    return {};
  }
}

function writeAccounts(accounts: Record<string, LocalAccount>) {
  if (hasStorage()) window.localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

async function hashPassword(email: string, password: string) {
  const input = `chief:${email}:${password}`;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    // fall through
  }
  return btoa(unescape(encodeURIComponent(input)));
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function localAuth(): { session: Session; profile: Profile } | null {
  if (!hasStorage()) return null;
  const email = window.localStorage.getItem(LOCAL_SESSION_KEY);
  if (!email) return null;
  const acc = readAccounts()[email];
  if (!acc) return null;
  const user = {
    id: acc.id,
    email: acc.email,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: { role: acc.role, full_name: acc.full_name },
    created_at: acc.created_at,
  } as unknown as User;
  const session = { access_token: "", refresh_token: "", token_type: "bearer", expires_in: 0, user } as unknown as Session;
  const profile = { id: acc.id, full_name: acc.full_name, role: acc.role, created_at: acc.created_at } as unknown as Profile;
  return { session, profile };
}

function isNetworkError(err: unknown) {
  if (!err) return false;
  const e = err as { name?: string; message?: string };
  return (
    e.name === "AuthRetryableFetchError" ||
    /failed to fetch|networkerror|load failed|fetch failed|network request failed/i.test(e.message ?? "")
  );
}

/* ---------------------------------------------------------------------------- */

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
  if (!session) {
    const local = localAuth();
    if (local) {
      setState({
        session: local.session,
        user: local.session.user,
        profile: local.profile,
        role: local.profile.role,
        loading: false,
      });
      return;
    }
  }
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
    .catch(() => applySession(null));
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

async function localSignIn(email: string, password: string): Promise<{ error: string | null }> {
  const key = email.trim().toLowerCase();
  const acc = readAccounts()[key];
  if (!acc || acc.passwordHash !== (await hashPassword(key, password))) {
    return { error: "Invalid login credentials" };
  }
  window.localStorage.setItem(LOCAL_SESSION_KEY, key);
  applySession(null);
  return { error: null };
}

async function localSignUp({ email, password, role, fullName }: SignUpInput): Promise<SignUpResult> {
  if (!hasStorage()) return { error: "Could not reach the server. Please try again.", needsConfirmation: false };
  const key = email.trim().toLowerCase();
  const accounts = readAccounts();
  if (accounts[key]) {
    return { error: "An account with this email already exists. Try signing in.", needsConfirmation: false };
  }
  accounts[key] = {
    id: newId(),
    email: key,
    passwordHash: await hashPassword(key, password),
    role,
    full_name: fullName?.trim() || null,
    created_at: new Date().toISOString(),
  };
  writeAccounts(accounts);
  window.localStorage.setItem(LOCAL_SESSION_KEY, key);
  applySession(null);
  return { error: null, needsConfirmation: false };
}

async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      if (isNetworkError(error)) return localSignIn(email, password);
      return { error: error.message };
    }
    if (hasStorage()) window.localStorage.removeItem(LOCAL_SESSION_KEY);
    return { error: null };
  } catch (err) {
    if (isNetworkError(err)) return localSignIn(email, password);
    return { error: messageOf(err, "Could not sign in. Please try again.") };
  }
}

async function signUp(input: SignUpInput): Promise<SignUpResult> {
  const { email, password, role, fullName } = input;
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { role, full_name: fullName?.trim() || null },
        emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/sign-in` : undefined,
      },
    });
    if (error) {
      if (isNetworkError(error)) return localSignUp(input);
      return { error: error.message, needsConfirmation: false };
    }
    // Supabase returns a user with no identities when the email is already taken.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: "An account with this email already exists. Try signing in.", needsConfirmation: false };
    }
    return { error: null, needsConfirmation: !data.session };
  } catch (err) {
    if (isNetworkError(err)) return localSignUp(input);
    return { error: messageOf(err, "Could not create your account."), needsConfirmation: false };
  }
}

async function signOut(): Promise<{ error: string | null }> {
  const hadLocal = hasStorage() && !!window.localStorage.getItem(LOCAL_SESSION_KEY);
  if (hasStorage()) window.localStorage.removeItem(LOCAL_SESSION_KEY);
  try {
    const { error } = await supabase.auth.signOut();
    if (hadLocal) applySession(null);
    if (error && !isNetworkError(error)) return { error: error.message };
    return { error: null };
  } catch (err) {
    if (hadLocal) applySession(null);
    if (isNetworkError(err)) return { error: null };
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
