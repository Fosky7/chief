import { Link } from "@tanstack/react-router";

import { containment, cx } from "@/config/containment";
import { layout, siteConfig, typography } from "@/config/theme";

/**
 * Footer destinations.
 *
 * Kept as a local `as const` list so each `to` stays a literal type and is
 * validated by TanStack Router's typed link union at compile time.
 */
const footerDestinations = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/dashboard", label: "Dashboard" },
] as const;

/**
 * Footer link styling.
 *
 * `min-h-11` guarantees the 44px touch target on phones without disturbing the
 * text rhythm from `sm` up. The focus ring uses the inset containment token so
 * a clipped ancestor can never slice the keyboard indicator off.
 */
const footerLink = cx(
  "inline-flex min-h-11 items-center rounded-full text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline",
  containment.focusRing,
);

/**
 * Footer — the quiet bottom band of the shared app chrome.
 *
 * Purely presentational and token driven:
 * - the outer container is `containment.routeRoot`-safe (`containment.noOverflow`)
 *   so the brand lockup, the link row and the legal note can never widen the
 *   document at any breakpoint;
 * - the link row wraps instead of overflowing, and every link is a 44px target;
 * - no background utility and no raw colour — the root's `bg-background` and the
 *   decorative backdrop keep showing through, exactly as they do behind
 *   `AppShell`.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-transparent">
      <div className={cx(layout.container, containment.noOverflow, "py-8")}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Brand lockup — truncates rather than pushing the column wider. */}
          <div className={cx(containment.noOverflow, "max-w-sm")}>
            <p className={cx("text-sm font-semibold tracking-tight", containment.noOverflow)}>
              {siteConfig.name}
            </p>
            <p className={cx("mt-1", typography.caption, "break-words")}>
              {siteConfig.description}
            </p>
          </div>

          {/* Destination links — wrap, never scroll the page. */}
          <nav aria-label="Footer" className={containment.noOverflow}>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {footerDestinations.map((destination) => (
                <li key={destination.to} className="min-w-0">
                  <Link
                    to={destination.to}
                    className={footerLink}
                    activeProps={{ className: "text-foreground" }}
                  >
                    {destination.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <p className={cx("mt-6 border-t border-border/60 pt-4", typography.caption, containment.noOverflow)}>
          © {year} {siteConfig.name}. Pledges release only after the bill clears.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
