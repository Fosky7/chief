import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Compass, LayoutDashboard, LogIn, LogOut, Plus, ShieldCheck, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveReviewer } from "@/services/admin";
import { ChiefLogo } from "@/components/ChiefLogo";

type SessionUser = { id: string; email: string | null };

// Dropdown rows: generous tap target, high-contrast label and a clearly
// tinted icon tile so every tab reads well against the solid panel background.
const itemBase =
  "group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-semibold leading-6 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30";
const itemInactive = "text-foreground hover:bg-primary/10 hover:text-foreground";
const itemActive = "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30";
const iconWrap =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20";

function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const u = data.session?.user;
        setUser(u ? { id: u.id, email: u.email ?? null } : null);
        setChecked(true);
      })
      .catch(() => active && setChecked(true));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
      setChecked(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return { user, checked };
}

function useIsAdmin(userId: string | null) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let active = true;
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    resolveReviewer()
      .then((r) => active && setIsAdmin(Boolean(r?.isAdmin)))
      .catch(() => active && setIsAdmin(false));
    return () => {
      active = false;
    };
  }, [userId]);
  return isAdmin;
}

/** Three bars that morph into an X when the menu is open. */
function HamburgerIcon({ open }: { open: boolean }) {
  const bar = "absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-out";
  return (
    <span aria-hidden="true" className="relative block h-4 w-5">
      <span className={`${bar} ${open ? "top-[7px] rotate-45" : "top-0"}`} />
      <span className={`${bar} top-[7px] ${open ? "scale-x-0 opacity-0" : "opacity-100"}`} />
      <span className={`${bar} ${open ? "top-[7px] -rotate-45" : "top-[14px]"}`} />
    </span>
  );
}

export function NavBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, checked } = useSessionUser();
  const isAdmin = useIsAdmin(user?.id ?? null);

  // The public leaderboard is intentionally reachable from the HOME page menu
  // dropdown only (plus the site footer) — never from an inner page's menu.
  // Keeping this derived from the live pathname means the row disappears the
  // moment the visitor navigates away from the home page.
  const isHome = pathname === "/" || pathname === "";

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close the menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  // Subtle elevation once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Outside click / Escape closes; focus moves into the panel on open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setBusy(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[nav] sign out failed", err);
    } finally {
      setBusy(false);
      setOpen(false);
      void navigate({ to: "/" });
    }
  }

  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  return (
    // `isolate` + an explicit high z-index keeps the whole header (and its
    // dropdown) in its own stacking context so page text can never paint over
    // the open menu, on mobile or desktop.
    <header className="sticky top-0 z-[60] isolate px-3 pt-3 md:px-4">
      {/* Solid scrim behind the open menu: page copy no longer shows through the
          gap between the pill and the panel, and a tap anywhere closes it. */}
      {open && (
        <div
          aria-hidden="true"
          data-testid="nav-menu-scrim"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-0 bg-foreground/40"
        />
      )}

      <div ref={wrapRef} className="relative z-10 mx-auto max-w-6xl">
        <nav
          aria-label="Main"
          className={`relative flex h-16 items-center justify-between gap-3 rounded-full border px-2.5 pl-3 backdrop-blur-xl transition-all duration-300 supports-[backdrop-filter]:bg-background/60 ${
            scrolled || open
              ? "border-border/70 bg-background/85 shadow-elegant"
              : "border-border/40 bg-background/70"
          }`}
        >
          <Link
            to="/"
            data-testid="brand-link"
            aria-label="Chief home"
            className="inline-flex items-center gap-2.5 rounded-full py-1 pr-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            <ChiefLogo size={36} decorative />
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">Chief</span>
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <span
                aria-hidden="true"
                className="bg-brand-gradient hidden h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-primary-foreground ring-2 ring-background sm:flex"
              >
                {initial}
              </span>
            )}
            {user && (
              <button
                type="button"
                onClick={signOut}
                disabled={busy}
                aria-label="Sign out"
                data-testid="nav-sign-out"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 text-sm font-semibold text-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            )}
            <button
              ref={buttonRef}
              type="button"
              aria-label={user ? "Account menu" : open ? "Close menu" : "Open menu"}
              aria-haspopup="true"
              aria-expanded={open}
              aria-controls="main-menu-panel"
              data-testid="nav-menu-toggle"
              onClick={() => setOpen((o) => !o)}
              className={`inline-flex h-11 items-center gap-2.5 rounded-full border px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
                open
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/70 bg-card/60 text-foreground hover:border-primary/30 hover:bg-primary/5"
              }`}
            >
              <HamburgerIcon open={open} />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>

          {open && (
            <div
              id="main-menu-panel"
              ref={panelRef}
              data-testid={user ? "user-menu" : "main-menu"}
              className="absolute right-0 top-[calc(100%+0.75rem)] z-50 flex max-h-[calc(100dvh-6rem)] w-[min(22rem,calc(100vw-1.5rem))] origin-top-right flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl ring-1 ring-black/10"
            >
              <div aria-hidden="true" className="bg-brand-gradient h-1 w-full shrink-0 opacity-80" />

              {user && (
                <div className="mx-2 mt-2 flex items-center gap-3 rounded-2xl bg-muted px-3 py-3">
                  <span className="bg-brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Signed in</p>
                    {user.email && (
                      <p className="truncate text-sm font-semibold text-foreground" title={user.email}>
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Scrolls inside the panel instead of growing past the viewport. */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
                <ul className="flex flex-col gap-1">
                  <li>
                    <Link
                      to="/discover"
                      data-testid="nav-discover"
                      className={itemBase}
                      activeProps={{ className: itemActive }}
                      inactiveProps={{ className: itemInactive }}
                    >
                      <span className={iconWrap}>
                        <Compass className="h-5 w-5" aria-hidden="true" />
                      </span>
                      Discover
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard"
                      data-testid="nav-dashboard"
                      className={itemBase}
                      activeProps={{ className: itemActive }}
                      inactiveProps={{ className: itemInactive }}
                    >
                      <span className={iconWrap}>
                        <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                      </span>
                      Dashboard
                    </Link>
                  </li>
                  {/* Leaderboard lives in the HOME page menu only (and in the
                      site footer) — inner pages never expose this row. */}
                  {isHome && (
                    <li>
                      <Link
                        to="/leaderboard"
                        data-testid="nav-leaderboard"
                        className={itemBase}
                        activeProps={{ className: itemActive }}
                        inactiveProps={{ className: itemInactive }}
                      >
                        <span className={iconWrap}>
                          <Trophy className="h-5 w-5" aria-hidden="true" />
                        </span>
                        Leaderboard
                      </Link>
                    </li>
                  )}
                  {user && isAdmin && (
                    <li>
                      <Link
                        to="/admin"
                        data-testid="nav-admin"
                        className={itemBase}
                        activeProps={{ className: itemActive }}
                        inactiveProps={{ className: itemInactive }}
                      >
                        <span className={iconWrap}>
                          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                        Admin
                      </Link>
                    </li>
                  )}
                </ul>

                <div aria-hidden="true" className="mx-3 my-2 h-px bg-border" />

                <div className="flex flex-col gap-2 px-1 pb-1">
                  <Link
                    to="/bills/new"
                    data-testid="nav-new-bill"
                    className="bg-brand-gradient shadow-elegant inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    New bill
                  </Link>
                  {user ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={signOut}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/30 disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 ${
                        checked ? "" : "opacity-80"
                      }`}
                    >
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Sign in
                    </Link>
                  )}
                </div>
              </div>

              <p className="flex shrink-0 items-center justify-center gap-1 border-t border-border bg-card px-3 py-3 text-xs text-muted-foreground">
                Every bill is reviewed before it goes live
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </p>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default NavBar;
