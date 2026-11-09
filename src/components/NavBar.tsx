import { Link } from "@tanstack/react-router";

/**
 * Primary site navigation. "Discover" opens the swipe deck at /discover.
 */
const navLinks = [
  { to: "/", label: "Home", testId: "nav-home" },
  { to: "/discover", label: "Discover", testId: "nav-discover" },
  { to: "/auth", label: "Post a bill", testId: "nav-post" },
] as const;

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4"
      >
        <Link to="/" className="text-brand-gradient text-xl font-bold tracking-tight" aria-label="Chief home">
          Chief
        </Link>
        <ul className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((l) => (
            <li key={l.to} className={l.to === "/" ? "hidden sm:block" : undefined}>
              <Link
                to={l.to}
                data-testid={l.testId}
                activeOptions={{ exact: true }}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                activeProps={{ className: "bg-primary/10 text-foreground" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              to="/signin"
              data-testid="nav-signin"
              className="bg-brand-gradient rounded-full px-3.5 py-1.5 text-sm font-semibold text-primary-foreground shadow-elegant"
            >
              Sign in
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default NavBar;
