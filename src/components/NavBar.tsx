import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChiefLogo } from "@/components/ChiefLogo";
import { GradientButton } from "@/components/ui/brand";

const links = [
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

const pillBase =
  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200";

// Floating frosted-glass navigation bar.
export function NavBar() {
  const [open, setOpen] = useState(false);

  // Close the mobile sheet on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="relative mx-auto max-w-6xl">
        <nav
          aria-label="Main"
          className="glass shadow-elegant flex h-14 items-center justify-between rounded-full pl-2 pr-2 sm:pl-3"
        >
          <Link
            to="/"
            aria-label="Chief home"
            data-testid="brand-link"
            className="flex items-center gap-2.5 rounded-full pr-2 font-bold text-foreground"
          >
            <span className="ring-gradient flex h-10 w-10 items-center justify-center rounded-full bg-card">
              <ChiefLogo className="h-7 w-7" decorative />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">Chief</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={pillBase}
                inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
                activeProps={{ className: "bg-primary/10 text-primary" }}
              >
                {l.label}
              </Link>
            ))}
            <GradientButton to="/sign-in" size="sm" className="ml-2">
              Sign in
            </GradientButton>
          </div>

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </nav>

        {open && (
          <div
            id="mobile-menu"
            className="glass shadow-elegant animate-fade-up absolute inset-x-0 top-full mt-2 rounded-3xl p-3 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-medium"
                  inactiveProps={{ className: "text-foreground hover:bg-muted" }}
                  activeProps={{ className: "bg-primary/10 text-primary" }}
                >
                  {l.label}
                </Link>
              ))}
              <GradientButton to="/sign-in" size="md" className="mt-1 w-full" onClick={() => setOpen(false)}>
                Sign in
              </GradientButton>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
