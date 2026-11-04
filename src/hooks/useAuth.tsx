import {
  useEffect,
  useSyncExternalStore,
  type PropsWithChildren,
  type ReactElement,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { SignUpRole } from "@/types";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpCredentials extends SignInCredentials {
  role: SignUpRole;
}

export interface AuthContextValue extends AuthState {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}

let authState: AuthState = {
  user: null,
  session: null,
  loading: true,
};

let initialized = false;
const listeners = new Set<() => void>();

function updateAuthState(nextState: Partial<AuthState>) {
  authState = { ...authState, ...nextState };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return authState;
}

const serverSnapshot: AuthState = {
  user: null,
  session: null,
  loading: true,
};

function getServerSnapshot() {
  return serverSnapshot;
}

function initializeAuth() {
  if (initialized) return;
  initialized = true;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    updateAuthState({
      session,
      user: session?.user ?? null,
      loading: false,
    });
  });

  void supabase.auth
    .getSession()
    .then(({ data, error }) => {
      if (error) {
        throw error;
      }

      updateAuthState({
        session: data.session,
        user: data.session?.user ?? null,
        loading: false,
      });
    })
    .catch(() => {
      updateAuthState({ user: null, session: null, loading: false });
    });

  // Keep the single application-wide listener active for the lifetime of the
  // browser page. Supabase removes it naturally when the page is unloaded.
  return subscription;
}

async function signIn({ email, password }: SignInCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;

  updateAuthState({
    user: data.user,
    session: data.session,
    loading: false,
  });
}

async function signUp({ email, password, role }: SignUpCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { role },
    },
  });

  if (error) throw error;

  // Supabase can obscure an existing account by returning a user with no
  // identities. Treat that response as an unsuccessful registration.
  if (!data.user || data.user.identities?.length === 0) {
    throw new Error("An account with this email may already exist.");
  }

  if (data.session) {
    updateAuthState({
      user: data.user,
      session: data.session,
      loading: false,
    });
  }
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  updateAuthState({ user: null, session: null, loading: false });
}

export function useAuth(): AuthContextValue {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    initializeAuth();
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
  };
}

/**
 * Optional provider retained for conventional root-layout composition. Auth
 * state itself is an external store, so consumers also work when rendered
 * outside this provider (including route-level and navigation consumers).
 */
export function AuthProvider({ children }: PropsWithChildren): ReactElement {
  useAuth();
  return <>{children}</>;
}
