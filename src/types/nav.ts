/**
 * Public shape of a header destination.
 *
 * Kept in its own module (rather than inline in `src/config/navigation.ts`) so
 * non-React consumers — the header, the footer, tests — can import the type
 * without pulling in the destination list itself.
 *
 * The `to` field reuses TanStack Router's own link union instead of a plain
 * `string`, which means every literal destination in the config is statically
 * validated at compile time (a typo like `/dashbord` fails the build).
 */

import type { LinkProps } from "@tanstack/react-router";

/**
 * The router's accepted destination union.
 *
 * `LinkProps["to"]` is optional on the component (TanStack allows a `<Link>`
 * without `to` when it is used purely for styling), so we strip `undefined` to
 * make `to` genuinely required on a navigation entry.
 */
export type NavTo = NonNullable<LinkProps["to"]>;

/**
 * A single header destination.
 *
 * - `to`         — router-validated path.
 * - `label`      — the full, human-readable name (shown from `sm` up).
 * - `shortLabel` — optional compact name shown on phones so three pills fit a
 *                  320px rail without truncating mid-word. When omitted, the
 *                  header falls back to `label` at every breakpoint.
 */
export interface NavItem {
  readonly to: NavTo;
  readonly label: string;
  readonly shortLabel?: string;
}
