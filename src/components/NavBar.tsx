import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const linkBase =
  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-primary";

/**
 * Top navigation. Exposes a "Discover" doorway to the swipe deck on every page
 * where it is rendered, plus auth entry at /auth.
 */
export function NavBar() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSignedIn(Boolean(data.session));
      })
      .catch(() => {
        /* unauthenticated or backend unavailable: show Sign in */
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore — state listener will reconcile */
    }
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="text-brand-gradient text-lg font-bold tracking-tight">
          Chief
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/"
            className={`${linkBase} text-muted-foreground`}
            activeOptions={{ exact: true }}
            activeProps={{ className: "text-primary" }}
          >
            Home
          </Link>
          <Link
            to="/discover"
            className={`${linkBase} text-muted-foreground`}
            activeProps={{ className: "text-primary" }}
          >
            Discover
          </Link>
          {signedIn ? (
            <button type="button" onClick={signOut} className={`${linkBase} text-muted-foreground`}>
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="bg-brand-gradient ml-1 rounded-full px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
