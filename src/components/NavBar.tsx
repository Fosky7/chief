import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ChiefLogo } from "@/components/ChiefLogo";

/**
 * Top navigation for every screen.
 *
 * Rendered once by the root Layout so each page only owns its <main> content.
 * It mirrors the live Supabase auth state: signed-out visitors get a "Sign in"
 * link to /auth, signed-in members get a "Sign out" button. The admin review
 * queue is linked here for everyone (the page itself gates the actions).
 */

const navLinkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const signInClass =
  "bg-brand-gradient ml-1 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const signOutClass =
  "ml-1 inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

export function NavBar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
      await navigate({ to: "/" });
    }
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
          <ChiefLogo
            size={28}
            data-testid="chief-logo"
            className="h-7 w-7 shrink-0 text-primary"
          />
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            Chief
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto flex flex-wrap items-center gap-1">
          <Link to="/discover" className={navLinkClass}>
            Discover
          </Link>
          <Link to="/dashboard" className={navLinkClass}>
            Dashboard
          </Link>
          <Link to="/admin" className={navLinkClass}>
            Admin review
          </Link>

          {!ready ? (
            <span aria-hidden="true" className="px-3 py-2 text-sm text-muted-foreground">
              …
            </span>
          ) : email ? (
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              className={signOutClass}
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          ) : (
            <Link to="/auth" className={signInClass}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
