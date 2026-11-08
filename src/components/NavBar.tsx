import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Primary site navigation. "Discover" leads straight to the swipe deck.
 * Links stay visible on every screen size (the nav is intentionally small),
 * so there is no hidden mobile menu to open first.
 */
export function NavBar() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSignedIn(Boolean(data.session));
      })
      .catch(() => {
        /* backend unreachable — treat as signed out */
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
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      await navigate({ to: "/" });
    } catch {
      /* ignore; auth listener keeps state in sync */
    } finally {
      setSigningOut(false);
    }
  }

  const linkBase =
    "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

  return (
    <header className="glass sticky top-0 z-50 border-b border-border/60">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-foreground" aria-label="Chief home">
          <span
            aria-hidden="true"
            className="bg-brand-gradient flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold text-primary-foreground shadow-elegant"
          >
            C
          </span>
          <span>Chief</span>
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
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className={`${linkBase} text-muted-foreground disabled:opacity-60`}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          ) : (
            <Link
              to="/auth"
              className="bg-brand-gradient rounded-full px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-opacity hover:opacity-90"
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
