import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth, type UserRole } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional role(s) allowed to view the content. */
  roles?: UserRole | UserRole[];
  /** Rendered when the user is signed in but lacks the required role. */
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, roles, fallback }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center text-muted-foreground"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Checking your account…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (roles) {
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!role || !allowed.includes(role)) {
      return fallback !== undefined ? <>{fallback}</> : <Navigate to="/" />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
