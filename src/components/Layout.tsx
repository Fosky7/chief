import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { NavBar } from "@/components/NavBar";
import { ChiefLogo } from "@/components/ChiefLogo";
import { GlowBackdrop } from "@/components/ui/brand";

/**
 * Footer navigation model.
 *
 * Labels are deliberately distinct from the main menu labels (Discover /
 * Dashboard / Sign in) so accessibility-based lookups never resolve two
 * different links with the same accessible name.
 *
 * "Top givers" is the footer's entry point to the public leaderboard — one of
 * exactly two places that link to it (the other is the HOME page menu
 * dropdown). Its `testId` makes that single entry point easy to target.
 */
type FooterLink = {
  to: "/" | "/discover" | "/dashboard" | "/leaderboard" | "/auth";
  label: string;
  testId?: string;
};

type LegalLink = {
  to: "/terms" | "/privacy" | "/cookies" | "/refunds" | "/disclaimer";
  label: string;
  testId: string;
};

/** Every legal page the site publishes, surfaced from the footer. */
const legalLinks: LegalLink[] = [
  { to: "/terms", label: "Terms of Service", testId: "footer-legal-terms" },
  { to: "/privacy", label: "Privacy Policy", testId: "footer-legal-privacy" },
  { to: "/cookies", label: "Cookie Policy", testId: "footer-legal-cookies" },
  { to: "/refunds", label: "Refund Policy", testId: "footer-legal-refunds" },
  { to: "/disclaimer", label: "Disclaimer", testId: "footer-legal-disclaimer" },
];

const footerHeading = "text-xs font-bold uppercase tracking-[0.16em] text-foreground";
const footerLinkCls =
  "inline-flex rounded-md py-0.5 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";

/**
 * Footer links always land the visitor at the top of the destination page,
 * including when the link points at the page they are already on. The scroll
 * runs immediately and again after the next paint so the new route's content
 * cannot leave the window parked at the old footer position.
 */
function scrollToTop() {
  if (typeof window === "undefined") return;
  const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  toTop();
  window.requestAnimationFrame(() => {
    toTop();
    window.requestAnimationFrame(toTop);
  });
  window.setTimeout(toTop, 60);
}

const footerLinks: FooterLink[] = [
  { to: "/", label: "Back to home" },
  { to: "/discover", label: "Explore bills" },
  { to: "/dashboard", label: "Your account" },
  { to: "/leaderboard", label: "Top givers", testId: "footer-leaderboard" },
  { to: "/auth", label: "Log in" },
];

// App shell: ambient glow, floating nav, page content and branded footer.
export function Layout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="grain isolate flex min-h-dvh flex-col bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <GlowBackdrop className="opacity-70" />
      </div>

      {/* The header sits above page content (z-[60]); main and footer stay in a
          lower layer so an open menu can never be painted over by page text. */}
      <NavBar />
      <main className="relative z-0 flex-1">{children}</main>

      <footer className="relative z-0 mt-16 px-3 pb-3 md:px-4" data-testid="site-footer">
        <div className="glass shadow-elegant mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border/60">
          <div aria-hidden="true" className="bg-brand-gradient h-1 w-full opacity-80" />

          <div className="grid gap-10 px-6 py-10 text-sm text-muted-foreground sm:grid-cols-2 sm:px-10 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div className="space-y-4 sm:col-span-2 lg:col-span-1">
              <span className="flex items-center gap-2.5 font-medium text-foreground" data-testid="footer-brand">
                <ChiefLogo className="h-6 w-6" decorative />
                <span>© {year} Chief. Every bill is reviewed before it goes live.</span>
              </span>
              <p className="max-w-sm leading-relaxed">
                Helping Nigerians cover rent, school fees and hospital bills — one swipe at a time.
              </p>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 font-medium text-foreground">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Payments secured by Paystack
              </span>
            </div>

            <nav aria-label="Footer">
              <p className={footerHeading}>Explore</p>
              <ul className="mt-4 flex flex-col gap-2">
                {footerLinks.map((l) => (
                  <li key={l.label}>
                    <Link to={l.to} data-testid={l.testId} className={footerLinkCls} onClick={scrollToTop}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="Legal" data-testid="footer-legal">
              <p className={footerHeading}>Legal</p>
              <ul className="mt-4 flex flex-col gap-2">
                {legalLinks.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} data-testid={l.testId} className={footerLinkCls} onClick={scrollToTop}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="border-t border-border/60 bg-background/40 px-6 py-5 text-xs leading-relaxed text-muted-foreground sm:px-10">
            <p className="max-w-3xl">
              Chief is a bill-crowdfunding platform, not a bank or lender. Donations are voluntary gifts
              paid directly toward verified bills and are processed by Paystack. Read our Terms of
              Service and Privacy Policy before giving or posting a bill.
            </p>
          </div>

          <div
            data-testid="footer-bottom-bar"
            className="flex flex-col gap-2 border-t border-border/60 px-6 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-10"
          >
            <span>© {year} Chief · Lagos, Nigeria</span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
              All bills verified by our review team
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
