import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { Header } from "@/components/Header";
import { cx } from "@/config/containment";
import { interactive, layout, siteConfig } from "@/config/theme";

/**
 * AppShell
 *
 * The single application chrome: it mounts `<Header />` exactly once per route
 * and gives the header's skip link a real, focusable target.
 *
 * Layout contract
 * ---------------
 *   <div>            one root wrapper (the only page-level backdrop/wash owner)
 *     <Header />     sticky, in normal flow — so `main` needs NO extra top
 *                    padding and `layout.headerOffset` stays honest
 *     <main id="main-content" tabIndex={-1}>   skip target + containment
 *     <footer>       plain footer navigation
 *
 * Containment contract
 * --------------------
 * Every level carries `min-w-0 max-w-full` (the geometry half of
 * `src/config/containment.ts`) plus `overflow-x-clip` on the root, so the
 * header's horizontally scrolling mobile rail and the landing page's grid can
 * never widen the document on a 320px viewport. Nothing here introduces a
 * second page-level wash or a colour/typography change.
 */

type AppShellProps = {
  /** Routed page content (rendered by `__root.tsx`). Optional so the shell is
   *  safe to mount in isolation (tests, stories) without children. */
  children?: ReactNode;
};

const footerLink =
  "inline-flex min-h-[2rem] shrink-0 items-center rounded-full px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Discover", to: "/discover" },
  { label: "Dashboard", to: "/dashboard" },
] as const;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex min-h-dvh w-full max-w-full flex-col overflow-x-clip">
      {/*
       * Mounted exactly once, above the skip target. The header is sticky but
       * stays in normal flow, so `main` deliberately carries no top padding.
       */}
      <Header />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 w-full max-w-full flex-1 outline-none"
      >
        {/* Containment wrapper: the page can never push the shell sideways. */}
        <div className="min-w-0 w-full max-w-full">{children}</div>
      </main>

      <footer className="mt-auto w-full max-w-full border-t border-border">
        <div
          className={cx(
            layout.container,
            "flex min-w-0 max-w-full flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            {siteConfig.name} — give directly, give with confidence.
          </p>

          <nav
            aria-label="Footer"
            className="flex min-w-0 flex-wrap items-center gap-1"
          >
            {footerLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cx(footerLink, interactive.focusRing)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
