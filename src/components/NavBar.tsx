import { Link } from "@tanstack/react-router";
import { Home, ShieldCheck } from "lucide-react";

type NavBarProps = Record<string, unknown>;

export function NavBar(_props: NavBarProps = {}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
            <Home className="h-4 w-4" />
          </span>
          Chief
        </Link>

        <div className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            to="/"
            className="rounded-full px-3 py-2 text-muted-foreground transition hover:bg-white/10 hover:text-white"
            activeProps={{ className: "rounded-full px-3 py-2 bg-white/10 text-white" }}
          >
            Home
          </Link>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-muted-foreground transition hover:bg-white/10 hover:text-white"
            activeProps={{
              className:
                "inline-flex items-center gap-2 rounded-full px-3 py-2 bg-emerald-500/15 text-emerald-200",
            }}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin review
          </Link>
        </div>
      </nav>
    </header>
  );
}
