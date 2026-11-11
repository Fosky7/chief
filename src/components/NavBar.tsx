import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const linkBase =
  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";
const linkIdle = "text-muted-foreground hover:bg-primary/10 hover:text-foreground";
const linkActive = "bg-primary/10 text-primary";

/** Site-wide navigation. Discover is always visible (no hamburger) so the deck is one tap away. */
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
        /* treat as signed out */
      });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3"
      >
        <Link to="/" className="text-brand-gradient text-xl font-bold tracking-tight">
          Chief
        </Link>
        <ul className="flex flex-wrap items-center gap-1">
          <li>
            <Link
              to="/"
              className={linkBase}
              activeOptions={{ exact: true }}
              activeProps={{ className: linkActive, "aria-current": "page" }}
              inactiveProps={{ className: linkIdle }}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/discover"
              data-testid="nav-discover"
              className={linkBase}
              activeProps={{ className: linkActive, "aria-current": "page" }}
              inactiveProps={{ className: linkIdle }}
            >
              Discover
            </Link>
          </li>
          <li className="hidden sm:block">
            <Link
              to="/auth"
              className={linkBase}
              activeProps={{ className: linkActive, "aria-current": "page" }}
              inactiveProps={{ className: linkIdle }}
            >
              Post a bill
            </Link>
          </li>
          <li>
            <a href="/admin" className={`${linkBase} ${linkIdle}`}>
              Admin
            </a>
          </li>
          <li>
            {signedIn ? (
              <button type="button" onClick={signOut} className={`${linkBase} ${linkIdle}`}>
                Sign out
              </button>
            ) : (
              <Link
                to="/signin"
                className={`${linkBase} bg-brand-gradient text-primary-foreground hover:brightness-110`}
              >
                Sign in
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default NavBar;
