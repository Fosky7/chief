import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children?: ReactNode;
  /** Heading shown to signed-out visitors. */
  title?: string;
  /** Optional custom fallback for signed-out visitors. */
  fallback?: ReactNode;
}

/**
 * Renders children only for signed-in users. Signed-out visitors see a
 * clear sign-in prompt (linking to /sign-in) instead of an error.
 */
export function ProtectedRoute({ children, title = "Dashboard", fallback }: ProtectedRouteProps) {
  const [session, setSession] = useState<Session | null>(null);
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
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground" role="status">
        Checking your session…
      </div>
    );
  }

  if (!session) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">You need to be signed in to view this page.</p>
        <a
          href="/sign-in"
          className="mt-6 inline-flex items-center rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground"
        >
          Sign in
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
