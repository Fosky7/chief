import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Prevents protected content from rendering until the current Supabase session
 * is known, then sends signed-out visitors to the authentication route.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/auth", replace: true });
    }
  }, [loading, navigate, user]);

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex min-h-[40vh] max-w-6xl items-center justify-center px-4 text-sm font-medium text-muted-foreground"
      >
        Checking your account…
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

export default ProtectedRoute;
