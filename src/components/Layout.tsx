import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { NavBar } from "@/components/NavBar";
import { ChiefLogo } from "@/components/ChiefLogo";
import { GlowBackdrop } from "@/components/ui/brand";

// Footer links use distinct labels so they never collide with the main nav
// labels (Discover / Dashboard / Sign in) in accessibility-based lookups.
const footerLinks = [
  { to: "/discover", label: "Explore bills" },
  { to: "/dashboard", label: "Your account" },
  { to: "/auth", label: "Log in" },
] as const;

// App shell: ambient glow, floating nav, page content and branded footer.
export function Layout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="grain isolate flex min-h-dvh flex-col bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <GlowBackdrop className="opacity-70" />
      </div>

      {/*
        Shared top bar. The brand lockup lives inside a real <header> so the
        logo is discoverable (and exposed with an accessible name containing
        "logo") at every width, on every route mounted under this shell —
        home, /auth, /discover and the bill pages alike.
      */}
      <header
        data-testid="site-header"
        className="relative z-20 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4"
      >
        <Link
          to="/"
          aria-label="Chief home"
          data-testid="brand-link"
          className="flex items-center gap-2 rounded-full text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChiefLogo size={28} className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-semibold tracking-tight">Chief</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <NavBar />
          <Link
            to="/auth"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Sign in
          </Link>
        </div>
      </header>
      <main className="relative flex-1">{children}</main>

      <footer className="relative mt-16">
        <div aria-hidden="true" className="bg-brand-gradient h-px w-full opacity-60" />
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-muted-foreground md:grid-cols-[2fr_1fr_auto] md:items-start">
          <div className="space-y-3">
            <span className="flex items-center gap-2 text-foreground" data-testid="footer-brand">
              <ChiefLogo className="h-6 w-6" decorative />
              <span>© {year} Chief. Every bill is reviewed before it goes live.</span>
            </span>
            <p className="max-w-sm leading-relaxed">
              Helping Nigerians cover rent, school fees and hospital bills — one swipe at a time.
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-col gap-2">
              {footerLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <span className="glass inline-flex items-center gap-2 self-start rounded-full px-4 py-2 font-medium text-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Payments secured by Paystack
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
