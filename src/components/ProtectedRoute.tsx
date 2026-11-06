import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Renders children only for signed-in visitors.
 * Signed-out visitors are redirected to /auth.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        className="mx-auto flex min-h-[40vh] max-w-md items-center justify-center px-4 text-sm text-muted-foreground"
      >
        Checking your account…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
