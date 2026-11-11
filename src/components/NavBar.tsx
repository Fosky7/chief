import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChiefLogo } from "@/components/ChiefLogo";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

const linkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground";

/** Site-wide navigation: brand, Discover, Dashboard, Admin and auth control, with a phone menu. */
export function NavBar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // Close the phone menu whenever the page changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close the phone menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    await navigate({ to: "/" });
  }

  const authControl = user ? (
    <button
      type="button"
      onClick={handleSignOut}
      className="ml-1 rounded-full border border-input px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/10"
    >
      Sign out
    </button>
  ) : (
    <Link
      to="/auth"
      aria-disabled={loading || undefined}
      className="bg-brand-gradient shadow-elegant ml-1 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
    >
      Sign in
    </Link>
  );

  const adminLink = (
    <a href="/admin" className={linkClass}>
      Admin
    </a>
  );

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <nav
        aria-label="Main"
        className="glass shadow-elegant mx-auto max-w-6xl rounded-3xl px-3 py-2 sm:rounded-full sm:px-5"
      >
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            data-testid="brand-link"
            aria-label="Chief home"
            className="flex items-center gap-2 rounded-full pr-2 font-display text-lg font-bold text-foreground"
          >
            <ChiefLogo className="h-8 w-8" decorative />
            <span>Chief</span>
          </Link>

          <div className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                data-testid={l.to === "/discover" ? "nav-discover" : undefined}
                className={linkClass}
                activeProps={{ className: "bg-primary/10 text-foreground", "aria-current": "page" }}
              >
                {l.label}
              </Link>
            ))}
            {adminLink}
            {authControl}
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary/10 sm:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {open && (
          <div id="mobile-menu" className="flex flex-col gap-1 pb-2 pt-2 sm:hidden">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={linkClass}
                activeProps={{ className: "bg-primary/10 text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
            {adminLink}
            <div className="pt-1">{authControl}</div>
          </div>
        )}
      </nav>
    </header>
  );
}

export default NavBar;
