import { Link, useNavigate } from "@tanstack/react-router";
import { ChiefLogo } from "@/components/ChiefLogo";
import { useAuth } from "@/hooks/useAuth";

const links = [
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

const linkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground";

export function NavBar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    await navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <nav
        aria-label="Main"
        className="glass shadow-elegant mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full px-3 py-2 sm:px-5"
      >
        <Link to="/" className="flex items-center gap-2 rounded-full pr-2 font-display text-lg font-bold text-foreground">
          <ChiefLogo className="h-8 w-8" decorative />
          <span>Chief</span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={linkClass}
              activeProps={{ className: "bg-primary/10 text-foreground" }}
            >
              {l.label}
            </Link>
          ))}

          {user ? (
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
          )}
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
