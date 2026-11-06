import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional list of roles allowed to view the content. */
  allowedRoles?: string[];
}

/** Redirects signed-out visitors to /auth; shows a loader while the session resolves. */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm">Checking your session…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && (!role || !allowedRoles.includes(role))) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold">Access restricted</h1>
        <p className="mt-3 text-muted-foreground">
          Your account doesn't have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
