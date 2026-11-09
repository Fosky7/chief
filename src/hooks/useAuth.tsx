import {
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthMode = "signIn" | "signUp";
export type SignUpRole = "donor" | "bill_requester";
export type UserRole = SignUpRole | "admin";

export interface AuthProfile {
  id: string;
  role: UserRole | null;
  email?: string | null;
  full_name?: string | null;
  [key: string]: unknown;
}

interface AuthSnapshot {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpInput extends Credentials {
  role: SignUpRole;
}

/* ------------------------------------------------------------------ */
/* Module-level store: one source of truth shared by every component.  */
/* Works with or without <AuthProvider> so existing layouts keep        */
/* working regardless of how they were wired in earlier modules.        */
/* ------------------------------------------------------------------ */

let state: AuthSnapshot = {
  session: null,
  user: null,
  profile: null,
  loading: true,
};
const listeners = new Set<() => void>();
let initialized = false;

function setState(patch: Partial<AuthSnapshot>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const serverSnapshot: AuthSnapshot = {
  session: null,
  user: null,
  profile: null,
  loading: true,
};

function metadataRole(user: User | null): UserRole | null {
  const raw = user?.user_metadata?.role;
  return raw === "donor" || raw === "bill_requester" || raw === "admin"
    ? raw
    : null;
}

function metadataName(user: User | null): string | null {
  const raw = user?.user_metadata?.full_name ?? user?.user_metadata?.name;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * Persists the signed-in user's own profile row from the client.
 *
 * The account is only really "created" once its row exists in `profiles`, so
 * this runs whenever a fresh session has no profile row yet (for example when
 * the database trigger that normally seeds it is missing or repaired).
 * Failures are non-fatal: the UI keeps working from the auth metadata role.
 */
async function persistProfile(user: User): Promise<AuthProfile | null> {
  const payload: Record<string, unknown> = {
    id: user.id,
    role: metadataRole(user) ?? "donor",
    email: user.email ?? null,
  };
  const name = metadataName(user);
  if (name) payload.full_name = name;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();
    if (error) throw error;
    if (data) return data as unknown as AuthProfile;
  } catch (err) {
    console.warn("[auth] Could not persist profile", err);
  }
  return null;
}

async function loadProfile(user: User | null): Promise<AuthProfile | null> {
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as unknown as AuthProfile;
  } catch (err) {
    console.warn("[auth] Could not load profile", err);
  }

  // No row yet: write it now so the account is really persisted.
  const created = await persistProfile(user);
  if (created) return created;

  // Fall back to the role captured at sign up so the UI stays usable.
  return { id: user.id, role: metadataRole(user), email: user.email ?? null };
}

async function applySession(session: Session | null) {
  const user = session?.user ?? null;
  setState({ session, user });
  const profile = await loadProfile(user);
  // Ignore stale results if the user changed while loading.
  if ((state.user?.id ?? null) === (user?.id ?? null)) {
    setState({ profile, loading: false });
  }
}

function initAuth() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  supabase.auth
    .getSession()
    .then(({ data }) => applySession(data.session))
    .catch((err) => {
      console.error("[auth] getSession failed", err);
      setState({ loading: false });
    });

  supabase.auth.onAuthStateChange((_event, session) => {
    // Defer to avoid running Supabase queries inside the auth callback.
    setTimeout(() => {
      void applySession(session);
    }, 0);
  });
}

/* ------------------------------- actions ------------------------------ */

async function signIn({ email, password }: Credentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error("Invalid login credentials");
  await applySession(data.session);
  return data;
}

async function signUp({ email, password, role }: SignUpInput) {
  if (role !== "donor" && role !== "bill_requester") {
    throw new Error("Please choose a valid account role.");
  }
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { role },
      emailRedirectTo:
        typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
    },
  });
  if (error) throw new Error(error.message);

  if (data.session) {
    await applySession(data.session);
    // Make sure the profile row exists even if the seed trigger did not fire.
    if (data.user && !state.profile) {
      const created = await persistProfile(data.user);
      if (created) setState({ profile: created });
    }
  }

  return { needsConfirmation: !data.session, user: data.user };
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.warn("[auth] signOut error", error);
  setState({ session: null, user: null, profile: null, loading: false });
}

async function refreshProfile() {
  const profile = await loadProfile(state.user);
  setState({ profile });
}

/* -------------------------------- hooks -------------------------------- */

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    initAuth();
  }, []);
  return <>{children}</>;
}

export function useAuth() {
  useEffect(() => {
    initAuth();
  }, []);

  const snapshot = useSyncExternalStore(
    subscribe,
    () => state,
    () => serverSnapshot,
  );

  const role: UserRole | null =
    snapshot.profile?.role ?? metadataRole(snapshot.user);

  return {
    ...snapshot,
    role,
    isAuthenticated: Boolean(snapshot.user),
    isAdmin: role === "admin",
    isDonor: role === "donor",
    isBillRequester: role === "bill_requester",
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };
}

export default useAuth;
