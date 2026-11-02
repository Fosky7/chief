/**
 * Canonical header destinations for Chief.
 *
 * The list is declared `as const` (and checked against the public `NavItem`
 * contract with `satisfies`) so TanStack Router still sees each literal `to`
 * and validates it statically — while the exported type stays wide enough for
 * `Header.tsx` to read the optional `shortLabel` without any casting.
 *
 * Footer / dynamic navigation keeps using `siteConfig.navigation` in
 * `src/config/theme.ts`; only the header list carries compact labels.
 */

import type { NavItem } from "@/types/nav";

/**
 * The header rail destinations, in display order.
 *
 * `shortLabel` is the phone-width name: it is rendered below `sm` so three
 * pills fit a 320px-wide rail (44px thumb targets + a 1.5px gap) without any
 * label truncating mid-word. From `sm` up the full `label` is restored.
 */
export const navigation = [
  { to: "/discover", label: "Discover", shortLabel: "Discover" },
  { to: "/dashboard", label: "Dashboard", shortLabel: "Dash" },
  { to: "/settings", label: "Settings", shortLabel: "Settings" },
] as const satisfies readonly NavItem[];

/**
 * The same destinations widened to the public contract.
 *
 * `Header.tsx` maps over this so the rendered `<Link>`s are typed as
 * `readonly NavItem[]` (i.e. `shortLabel` is optional) rather than as the
 * narrow tuple of literals above.
 */
export const headerNavItems: readonly NavItem[] = navigation;

/** A concrete destination from the literal list (handy for helper props). */
export type HeaderDestination = (typeof navigation)[number];

/**
 * Accessible names and helper copy used by the header chrome. Every string the
 * rail announces lives here so the component itself stays purely structural.
 */
export const headerNavCopy = {
  /** `aria-label` on the wrapping `<nav>`. */
  navLabel: "Primary",
  /** `aria-label` on the scrollable tab strip (`role="group"`). */
  tabListLabel: "Primary destinations",
  /**
   * Accessible name for the brand / home lockup.
   *
   * The lockup renders the cap mark *decoratively* next to the wordmark, so
   * this single label is what assistive tech announces for the whole entity:
   * "Chief — home", never "chief cap Chief".
   */
  homeLabel: "Chief — home",
  /**
   * Description of the chief-cap brand mark.
   *
   * The header keeps the mark decorative (the link's `aria-label` names the
   * lockup, so the logo must not be announced twice), but this string is the
   * ready-made accessible name for any non-decorative reuse — e.g.
   * `<ChiefCapLogo decorative={false} title={headerNavCopy.brandMarkLabel} />`
   * in a footer, an empty state or an about page.
   */
  brandMarkLabel: "Igbo traditional chief's cap",
  /**
   * Optional short title for the mark (tooltip / standalone brand block).
   * Unused by the header today; kept here so copy edits never touch JSX.
   */
  logoTitle: "Chief",
  /** Visually hidden hint announced alongside the scrollable strip. */
  scrollHint: "Scroll horizontally to see more destinations.",
} as const;
