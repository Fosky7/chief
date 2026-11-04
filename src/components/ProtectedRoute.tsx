import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GradientButton } from "@/components/ui/brand";
import { ROLE_LABELS, type UserRole } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If set, only these roles may view the content. */
  roles?: UserRole[];
}

const shimmer =
  "animate-shimmer rounded-2xl bg-[linear-gradient(90deg,var(--muted)_0%,var(--card)_50%,var(--muted)_100%)]";

/** Gate content behind sign in (and optionally a role). */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16" aria-busy="true">
        <p className="sr-only">Loading…</p>
        <div aria-hidden="true" className={`h-8 w-1/2 ${shimmer}`} />
        <div aria-hidden="true" className={`mt-6 h-40 ${shimmer}`} />
      </div>
    );
  }

  if (!user) {
    return (
      <Gate
        title="Sign in to continue"
        body="You need a Chief account to view this page. It only takes a minute."
        action={
          <GradientButton to="/auth" size="lg" className="mt-6">
            Sign in or create an account
          </GradientButton>
        }
      />
    );
  }

  if (roles && (!role || !roles.includes(role))) {
    const allowed = roles.map((r) => ROLE_LABELS[r]).join(" or ");
    return (
      <Gate
        title="Not available for your account"
        body={`This page is only for ${allowed} accounts.`}
        action={
          <GradientButton to="/" size="lg" className="mt-6">
            Go home
          </GradientButton>
        }
      />
    );
  }

  return <>{children}</>;
}

function Gate({ title, body, action }: { title: string; body: string; action: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="glass shadow-elegant rounded-3xl px-6 py-12 text-center sm:px-10">
        <div
          aria-hidden="true"
          className="bg-brand-gradient animate-float mx-auto h-20 w-20 rounded-[40%_60%_55%_45%/50%_45%_55%_50%] opacity-80"
        />
        <h1 className="mt-6 font-display text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{body}</p>
        {action}
      </div>
    </div>
  );
}

export default ProtectedRoute;
