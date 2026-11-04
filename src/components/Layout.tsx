import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { NavBar } from "@/components/NavBar";
import { ChiefLogo } from "@/components/ChiefLogo";
import { GlowBackdrop } from "@/components/ui/brand";
import { useAuth } from "@/hooks/useAuth";

const footerLinks = [
  { to: "/discover", label: "Explore bills" },
  { to: "/dashboard", label: "Your account" },
] as const;

// App shell: ambient glow, floating nav, page content and branded footer.
export function Layout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      await navigate({ to: "/" });
    } catch (error) {
      // Keep the provider's authenticated state visible if Supabase rejects the
      // request instead of presenting a false signed-out state.
      console.error("Could not sign out", error);
    }
  }

  return (
    <div className="grain isolate flex min-h-dvh flex-col bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <GlowBackdrop className="opacity-70" />
      </div>

      <NavBar />
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
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                {loading ? (
                  <span aria-label="Checking account">Checking account…</span>
                ) : user ? (
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="transition-colors hover:text-primary"
                  >
                    Sign out
                  </button>
                ) : (
                  <Link to="/auth" className="transition-colors hover:text-primary">
                    Create or sign in
                  </Link>
                )}
              </li>
            </ul>
          </nav>

          <span className="glass inline-flex items-center gap-2 self-start rounded-full px-4 py-2 font-medium text-foreground">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-success"
              aria-hidden="true"
            >
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
