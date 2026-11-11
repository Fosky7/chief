import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Plus, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChiefLogo } from "@/components/ChiefLogo";

type NavItem = { label: string; href: string };

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Discover", href: "/discover" },
  { label: "Dashboard", href: "/dashboard" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          to="/"
          aria-label="Chief home"
          className="flex items-center gap-2 font-bold text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600">
            <Home className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg tracking-tight">Chief</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/bills/new"
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Submit a bill
          </Link>
          {signedIn ? (
            <button
              type="button"
              onClick={signOut}
              className="ml-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white"
            >
              Sign out
            </button>
          ) : (
            <a
              href="/auth"
              className="ml-2 inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white"
            >
              <User className="h-4 w-4" />
              Sign in
            </a>
          )}
        </nav>

        <button
          type="button"
          className="rounded-md p-2 text-slate-200 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-white/10 px-4 pb-4 md:hidden">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/bills/new"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-1 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950"
          >
            <Plus className="h-4 w-4" />
            Submit a bill
          </Link>
          {signedIn ? (
            <button
              type="button"
              onClick={signOut}
              className="mt-2 block w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground"
            >
              Sign out
            </button>
          ) : (
            <a href="/auth" className="mt-2 flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground">
              <Search className="hidden" />
              <User className="h-4 w-4" />
              Sign in
            </a>
          )}
        </nav>
      )}
    </header>
  );
}

export default NavBar;
