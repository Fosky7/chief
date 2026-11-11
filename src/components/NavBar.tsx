import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ShieldCheck, Home } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NavBar(_props: { [key: string]: unknown } = {}) {
  const [open, setOpen] = useState(false);
  const linkClass =
    "inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground";
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold tracking-tight">
          Bill Chief
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-lg p-2 sm:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col gap-1 border-b bg-background p-3 sm:static sm:flex sm:flex-row sm:border-0 sm:bg-transparent sm:p-0`}>
          <Link to="/" className={linkClass} onClick={() => setOpen(false)}>
            <Home className="h-4 w-4" /> Home
          </Link>
          <Link to="/admin" className={linkClass} onClick={() => setOpen(false)}>
            <ShieldCheck className="h-4 w-4" /> Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default NavBar;
