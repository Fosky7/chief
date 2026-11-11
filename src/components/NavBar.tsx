import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ChiefLogo } from "@/components/ChiefLogo";

/** Primary destinations shown in both the desktop and mobile navigation. */
const links = [
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/admin", label: "Admin" },
] as const;

const linkClass =
  "rounded-full px-3.5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";
const activeClass = "bg-primary/10 text-foreground";

function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
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
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return signedIn;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NavBar(_props: { [key: string]: unknown } = {}) {
  const navigate = useNavigate();
  const signedIn = useSignedIn();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const signOut = useCallback(async () => {
    setOpen(false);
    try {
      await supabase.auth.signOut();
    } finally {
      await navigate({ to: "/" });
    }
  }, [navigate]);

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          to="/"
          data-testid="brand-link"
          aria-label="Chief home"
          className="inline-flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          <ChiefLogo className="h-8 w-8 text-primary" decorative />
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">Chief</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={linkClass} activeProps={{ className: activeClass }}>
              {l.label}
            </Link>
          ))}
          {signedIn ? (
            <button type="button" onClick={() => void signOut()} className={linkClass}>
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="bg-brand-gradient shadow-elegant ml-2 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              Sign in
            </Link>
          )}
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-primary/10 md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-border/60 px-4 pb-4 pt-2 md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`block ${linkClass}`}
                  activeProps={{ className: activeClass }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              {signedIn ? (
                <button type="button" onClick={() => void signOut()} className={`block w-full text-left ${linkClass}`}>
                  Sign out
                </button>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className={`block ${linkClass}`}>
                  Sign in
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export default NavBar;
