import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChiefLogo } from "@/components/ChiefLogo";

const linkBase =
  "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";
const linkIdle = "text-muted-foreground hover:bg-primary/10 hover:text-foreground";

const links = [
  { to: "/", label: "Home", exact: true },
  { to: "/discover", label: "Discover", exact: false },
  { to: "/dashboard", label: "Dashboard", exact: false },
] as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NavBar(_props: Record<string, unknown> = {}) {
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  const authItem = signedIn ? (
    <button type="button" onClick={() => void signOut()} className={`${linkBase} ${linkIdle}`}>
      Sign out
    </button>
  ) : (
    <Link
      to="/auth"
      onClick={() => setOpen(false)}
      className={`${linkBase} bg-brand-gradient text-primary-foreground hover:brightness-110`}
    >
      Sign in
    </Link>
  );

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <nav aria-label="Main" className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link
            to="/"
            data-testid="brand-link"
            aria-label="Chief home"
            className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground"
          >
            <ChiefLogo className="h-7 w-7 text-primary" />
            <span className="text-brand-gradient">Chief</span>
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`${linkBase} ${linkIdle}`}
                  activeOptions={{ exact: l.exact }}
                  activeProps={{ "aria-current": "page" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/admin" className={`${linkBase} ${linkIdle}`}>
                Admin
              </a>
            </li>
            <li>{authItem}</li>
          </ul>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="rounded-full p-2 text-foreground hover:bg-primary/10 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <ul id="mobile-menu" className="flex flex-col gap-1 pb-4 md:hidden">
            {links.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`block ${linkBase} ${linkIdle}`}
                  activeOptions={{ exact: l.exact }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="/admin" className={`block ${linkBase} ${linkIdle}`}>
                Admin
              </a>
            </li>
            <li>{authItem}</li>
          </ul>
        )}
      </nav>
    </header>
  );
}

export default NavBar;
