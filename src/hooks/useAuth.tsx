import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  isSignupRole,
  type AuthContextValue,
  type ProfileRow,
  type SignInResult,
  type SignOutResult,
  type SignUpInput,
  type SignUpResult,
  type SignupRole,
} from "@/types";

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthErrorLike {
  message?: unknown;
  code?: unknown;
  status?: unknown;
}

function errorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const message = (error as AuthErrorLike).message;
  return typeof message === "string" ? message.trim() : "";
}

/**
 * Converts provider errors into stable messages suitable for display. Provider
 * wording can change between Supabase releases, so known cases are normalized.
 */
function friendlyAuthError(error: unknown, operation: "signin" | "signup" | "signout"): string {
  const message = errorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) return "Invalid login credentials";
  if (normalized.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (normalized.includes("user already registered") || normalized.includes("already been registered")) {
    return "An account with this email already exists.";
  }
  if (normalized.includes("password") && normalized.includes("at least")) {
    return "Password must be at least 6 characters.";
  }
  if (normalized.includes("invalid") && normalized.includes("email")) {
    return "Enter a valid email address.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "Could not reach Chief. Check your connection and try again.";
  }

  if (operation === "signin") return "Could not sign in. Please check your details and try again.";
  if (operation === "signup") return "Could not create your account. Please try again.";
  return "Could not sign out. Please try again.";
}

function roleFromUser(user: User | null): SignupRole | null {
  const metadataRole = user?.user_metadata?.role;
  return isSignupRole(metadataRole) ? metadataRole : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<SignupRole | null>(null);
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(false);
  const transitionRef = useRef(0);

  /**
   * Publishes a session immediately, then resolves its authoritative profile.
   * A monotonically increasing transition guards against a delayed profile
   * response restoring the role from an older session.
   */
  const applySession = useCallback(async (nextSession: Session | null): Promise<void> => {
    const transition = ++transitionRef.current;
    const nextUser = nextSession?.user ?? null;
    const metadataRole = roleFromUser(nextUser);

    if (!mountedRef.current) return;

    setSession(nextSession);
    setUser(nextUser);
    setRole(metadataRole);

    if (!nextUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, role, full_name, created_at, updated_at")
        .eq("id", nextUser.id)
        .maybeSingle();

      if (!mountedRef.current || transition !== transitionRef.current) return;

      const profile = data as ProfileRow | null;
      setRole(profile && isSignupRole(profile.role) ? profile.role : metadataRole);
    } catch {
      // The trigger-created profile can briefly be unavailable. Validated user
      // metadata remains the temporary fallback until the next auth event.
      if (!mountedRef.current || transition !== transitionRef.current) return;
      setRole(metadataRole);
    } finally {
      if (mountedRef.current && transition === transitionRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let observedAuthEvent = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      observedAuthEvent = true;
      void applySession(nextSession);
    });

    // Register the listener first so a session transition occurring during the
    // initial read cannot be missed or overwritten by a stale response.
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mountedRef.current || observedAuthEvent) return;

      if (error) {
        void applySession(null);
        return;
      }

      void applySession(data.session);
    });

    return () => {
      mountedRef.current = false;
      ++transitionRef.current;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { error: friendlyAuthError(error, "signin"), user: null, session: null };
        }

        // Auth events normally perform this update. Applying the returned
        // session as well keeps consumers responsive if event delivery is late.
        await applySession(data.session);
        return { error: null, user: data.user, session: data.session };
      } catch (error) {
        return { error: friendlyAuthError(error, "signin"), user: null, session: null };
      }
    },
    [applySession],
  );

  const signUp = useCallback(
    async ({ email, password, role: selectedRole, fullName }: SignUpInput): Promise<SignUpResult> => {
      const trimmedEmail = email.trim();
      const trimmedName = fullName?.trim().slice(0, 120) ?? "";

      if (!isSignupRole(selectedRole)) {
        return {
          error: "Choose a valid account role.",
          user: null,
          session: null,
          needsConfirmation: false,
        };
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              role: selectedRole,
              full_name: trimmedName || null,
            },
          },
        });

        if (error) {
          return {
            error: friendlyAuthError(error, "signup"),
            user: null,
            session: null,
            needsConfirmation: false,
          };
        }

        if (data.session) {
          await applySession(data.session);
        }

        return {
          error: null,
          user: data.user,
          session: data.session,
          needsConfirmation: Boolean(data.user && !data.session),
        };
      } catch (error) {
        return {
          error: friendlyAuthError(error, "signup"),
          user: null,
          session: null,
          needsConfirmation: false,
        };
      }
    },
    [applySession],
  );

  const signOut = useCallback(async (): Promise<SignOutResult> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { error: friendlyAuthError(error, "signout") };

      await applySession(null);
      return { error: null };
    } catch (error) {
      return { error: friendlyAuthError(error, "signout") };
    }
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, role, loading, signIn, signUp, signOut }),
    [user, session, role, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
