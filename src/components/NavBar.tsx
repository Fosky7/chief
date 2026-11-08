import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Primary site navigation. "Discover" is always visible so donors can reach the swipe deck from anywhere. */
export function NavBar() {
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSignedIn(Boolean(data.session));
      })
      .catch(() => {
        if (active) setSignedIn(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      void navigate({ to: "/" });
    }
  }

  const linkBase =
    "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/50">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span
            aria-hidden="true"
            className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground shadow-elegant"
          >
            C
          </span>
          <span className="text-brand-gradient">Chief</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/discover"
            className={`${linkBase} text-muted-foreground`}
            activeProps={{ className: `${linkBase} bg-primary/10 text-primary`, "aria-current": "page" }}
          >
            Discover
          </Link>
          {signedIn ? (
            <button type="button" onClick={handleSignOut} className={`${linkBase} hidden text-muted-foreground sm:inline-flex`}>
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className={`${linkBase} hidden text-muted-foreground sm:inline-flex`}
              activeProps={{ className: `${linkBase} hidden bg-primary/10 text-primary sm:inline-flex` }}
            >
              Sign in
            </Link>
          )}
          <Link
            to="/auth"
            className="bg-brand-gradient hidden rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            Post a bill
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
