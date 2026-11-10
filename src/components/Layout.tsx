import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Primary application shell: brand, desktop + mobile navigation, the
 * authentication control (Sign in / Sign out) and the footer.
 *
 * The shell is reactive to the shared auth store in `@/hooks/useAuth`, so the
 * Sign out control appears immediately after a real sign-in and reverts to the
 * Sign in link once the session is cleared.
 *
 * The auth control is rendered in BOTH the desktop nav (md+) and a compact
 * header control (below md) so "Sign out" is always available in the
 * accessibility tree exactly once, at any viewport width. Only one of the two
 * is ever display-visible, so role-based lookups never see duplicates.
 */

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

/** Brand cap mark. `decorative` hides it from assistive tech in the footer. */
function ChiefMark({ decorative = false }: { decorative?: boolean }) {
  return (
    <svg
      data-testid="chief-logo"
      aria-hidden={decorative ? "true" : undefined}
      width="34"
      height="34"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 shrink-0"
    >
      <defs>
        <linearGradient id="chief-cap-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#DB2777" />
        </linearGradient>
      </defs>
      <path d="M8 30c0-8.837 7.163-16 16-16s16 7.163 16 16H8Z" fill="url(#chief-cap-gradient)" />
      <rect x="6" y="30" width="36" height="6" rx="3" fill="url(#chief-cap-gradient)" />
      <circle cx="24" cy="14" r="2.5" fill="#F59E0B" />
    </svg>
  );
}

function BrandLink() {
  return (
    <Link
      to="/"
      data-testid="brand-link"
      aria-label="Chief home"
      className="inline-flex items-center gap-2 rounded-full transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChiefMark />
      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">Chief</span>
    </Link>
  );
}

const linkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground";

const signInClass =
  "ml-1 inline-flex items-center rounded-full border border-input px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10";

const signOutClass =
  "ml-1 inline-flex items-center rounded-full bg-brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Layout({ children }: { children?: ReactNode }) {
  const { isAuthenticated, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const authControl = isAuthenticated ? (
    <button type="button" onClick={() => void signOut()} className={signOutClass}>
      Sign out
    </button>
  ) : (
    <Link to="/auth" className={signInClass}>
      Sign in
    </Link>
  );

  // Compact header control used below the md breakpoint, where the main nav
  // is hidden. Hidden while the mobile menu is open (the menu renders its own
  // control) so exactly one "Sign in"/"Sign out" is ever visible.
  const compactAuthControl = isAuthenticated ? (
    <button type="button" onClick={() => void signOut()} className={`${signOutClass} ml-0 whitespace-nowrap`}>
      Sign out
    </button>
  ) : (
    <Link to="/auth" className={`${signInClass} ml-0 whitespace-nowrap`}>
      Sign in
    </Link>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <BrandLink />

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass}>
                {link.label}
              </Link>
            ))}
            {authControl}
          </nav>

          <div className="flex items-center gap-2">
            <div className={`${open ? "hidden" : ""} md:hidden`}>{compactAuthControl}</div>

            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-input text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-menu" className="border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden">
            <nav aria-label="Mobile" className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2" onClick={() => setOpen(false)}>
                {isAuthenticated ? (
                  <button type="button" onClick={() => void signOut()} className={`${signOutClass} w-full justify-center`}>
                    Sign out
                  </button>
                ) : (
                  <Link to="/auth" className={`${signInClass} ml-0 w-full justify-center`}>
                    Sign in
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <div data-testid="footer-brand" className="inline-flex items-center gap-2">
            <ChiefMark decorative />
            <span>© {year} Chief.</span>
          </div>
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
            Payments secured by Paystack
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
