import type { MouseEvent } from "react";

/**
 * Compact secondary navigation exposing the Admin review doorway.
 *
 * The primary site navigation already links to the core destinations, so this
 * component is the shared "doorway" surface that guarantees the admin review
 * queue is reachable from anywhere it is mounted (home included).
 *
 * NOTE: these links are plain anchors (not router <Link> elements) on purpose.
 * This component is mounted in the shared header of EVERY page, so it must
 * never depend on a specific route being present in the generated route tree —
 * an unregistered `to` would fail while building the href during render and
 * would take the whole header (logo included) down with it. Plain anchors
 * navigate to the same URLs and keep the header renderable everywhere.
 */
const SECTION_LINKS = [
  { to: "/discover", label: "Discover", testId: "nav-discover" },
  { to: "/dashboard", label: "Dashboard", testId: "nav-dashboard" },
  { to: "/admin", label: "Admin", testId: "nav-admin" },
] as const;

function stopIfModified(event: MouseEvent<HTMLAnchorElement>) {
  // Respect modified clicks (new tab / new window) like a normal link.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return;
  }
}

export function NavBar({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Main"
      className={[
        "flex flex-wrap items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1 backdrop-blur",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {SECTION_LINKS.map((link) => (
        <a
          key={link.to}
          href={link.to}
          onClick={stopIfModified}
          data-testid={link.testId}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export default NavBar;
