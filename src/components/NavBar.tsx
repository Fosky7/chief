import { Link } from "@tanstack/react-router";

/**
 * Compact secondary navigation exposing the Admin review doorway.
 *
 * The primary site navigation already links to the core destinations, so this
 * component is the shared "doorway" surface that guarantees the admin review
 * queue is reachable from anywhere it is mounted (home included). Routing goes
 * through the TanStack router so client-side navigation stays intact.
 */
const SECTION_LINKS = [
  { to: "/discover", label: "Discover", testId: "nav-discover" },
  { to: "/dashboard", label: "Dashboard", testId: "nav-dashboard" },
  { to: "/admin", label: "Admin", testId: "nav-admin" },
] as const;

export function NavBar({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Site sections"
      className={[
        "flex flex-wrap items-center gap-1 rounded-full border border-border bg-card/80 px-2 py-1 backdrop-blur",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {SECTION_LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          data-testid={link.testId}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default NavBar;
