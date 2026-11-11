import { useState } from "react";
import { Menu, X, Plus, Home, Search, User } from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof Home; primary?: boolean };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Search },
  { href: "/dashboard", label: "Dashboard", icon: User },
  { href: "/bills/new", label: "Submit a bill", icon: Plus, primary: true },
];

// Accepts arbitrary props so existing callers (e.g. Layout) keep compiling.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NavBar(_props: { [key: string]: unknown } = {}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" aria-label="Chief home" className="text-lg font-bold tracking-tight">
          Chief
        </a>
        <nav aria-label="Main" className="hidden items-center gap-2 md:flex">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className={
                  item.primary
                    ? "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-4 py-1.5 text-sm font-semibold text-white"
                    : "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm opacity-80 hover:bg-white/10 hover:opacity-100"
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </a>
            );
          })}
        </nav>
        <button
          type="button"
          className="rounded-md p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <nav aria-label="Mobile" className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

export default NavBar;
