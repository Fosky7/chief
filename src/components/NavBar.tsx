import { Link } from "@tanstack/react-router";
import { Home, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type NavBarProps = Record<string, unknown>;

/**
 * Shared top navigation. Renders the brand, the primary links and the
 * session-aware control: signed-out visitors get a Sign in link, signed-in
 * visitors get a Sign out button that ends the session.
 */
export function NavBar(_props: NavBarProps = {}) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
      >
        <Link
          to="/"
          data-testid="brand-link"
          className="flex items-center gap-2 text-sm font-semibold text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
            <Home className="h-4 w-4" aria-hidden="true" />
          </span>
          Chief
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            to="/"
            className="rounded-full px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            activeProps={{ className: "rounded-full px-3 py-2 bg-white/10 text-white" }}
          >
            Home
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            activeProps={{
              className:
                "inline-flex items-center gap-2 rounded-full px-3 py-2 bg-emerald-500/15 text-emerald-200",
            }}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Admin review
          </Link>

          {user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-full border border-white/15 px-3 py-2 font-semibold text-white transition hover:bg-white/10"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full bg-emerald-400 px-3 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
