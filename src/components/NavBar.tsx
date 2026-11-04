import { Link } from "@tanstack/react-router";
import { useState } from "react";

const links = [
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

export function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">₦</span>
          <span className="text-lg tracking-tight">SwipePay</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium bg-muted text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/signin"
            className="ml-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-foreground md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
                {l.label}
              </Link>
            ))}
            <Link to="/signin" onClick={() => setOpen(false)} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
