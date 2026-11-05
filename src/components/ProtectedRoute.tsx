import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type AccountRole } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Restrict access to specific roles. Omit to allow any signed-in user. */
  roles?: AccountRole[];
}

/**
 * Guards a page: signed-out visitors are redirected to /auth, and signed-in
 * users without an allowed role are sent back home.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  const allowed =
    Boolean(user) && (!roles || roles.length === 0 || (role !== null && roles.includes(role)));

  useEffect(() => {
    if (loading) return;
    if (!user) {
      void navigate({ to: "/auth" });
    } else if (!allowed) {
      void navigate({ to: "/" });
    }
  }, [loading, user, allowed, navigate]);

  if (loading || !allowed) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <span
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"
        />
        <p className="text-sm text-muted-foreground">
          {loading ? "Checking your account…" : "Redirecting…"}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
