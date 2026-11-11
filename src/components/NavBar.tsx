import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChiefLogo } from "@/components/ChiefLogo";

/**
 * Top navigation for every screen.
 *
 * Rendered once by the root Layout so each page only owns its <main> content.
 * The brand lock-up renders the shared ChiefLogo (an <svg> with the accessible
 * name "Chief logo") inside <header> so every route has a real, labelled logo.
 * It mirrors the live Supabase auth state: signed-out visitors get a "Sign in"
 * link to /auth, signed-in members get a "Sign out" button.
 */

const navLinkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const signInClass =
  "bg-brand-gradient ml-1 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const signOutClass =
  "ml-1 inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

const navItems = [
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/admin", label: "Admin review" },
] as const;

export function NavBar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    // Resolve the current session once, then keep in sync with auth events so a
    // sign-in on /auth flips the nav to "Sign out" without a reload.
    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setEmail(data.session?.user.email ?? null);
      } catch {
        if (active) setEmail(null);
      } finally {
        if (active) setReady(true);
      }
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      await supabase.auth.signOut();
    } catch {
      // A failed network sign-out must not trap the visitor in a signed-in UI.
    } finally {
      setEmail(null);
      setSigningOut(false);
      setMenuOpen(false);
      await navigate({ to: "/" });
    }
  }

  function renderAuthControl(closeMenu: boolean) {
    if (!ready) {
      return (
        <span aria-hidden="true" className="px-3 py-2 text-sm text-muted-foreground">
          …
        </span>
      );
    }

    if (email) {
      return (
        <button
          type="button"
          onClick={() => {
            if (closeMenu) setMenuOpen(false);
            void handleSignOut();
          }}
          disabled={signingOut}
          className={signOutClass}
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      );
    }

    return (
      <Link
        to="/auth"
        onClick={() => {
          if (closeMenu) setMenuOpen(false);
        }}
        className={signInClass}
      >
        Sign in
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link
          to="/"
          aria-label="Chief home"
          data-testid="brand-link"
          className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChiefLogo className="h-8 w-8 text-primary" />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Chief
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </Link>
          ))}
          {renderAuthControl(false)}
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-full border border-border bg-background p-2 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md"
        >
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={`${navLinkClass} block w-full`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-1">{renderAuthControl(true)}</li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}

export default NavBar;
