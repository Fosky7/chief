/**
 * Containment tokens — the single source of truth for horizontal containment.
 *
 * INVARIANT
 * ---------
 * Every layer in the app (route root, app shell, container, card, deck, scroll
 * rail) is `max-w-full`, so a stray child — a 900px image, a long unbroken
 * recipient name, or a card mid-`translate-x` swipe — can never contribute
 * scroll width to the document at any breakpoint (320px → desktop).
 *
 * The module is intentionally dependency-free (no React, no router imports) so
 * it can be imported from routes, components, plain config and CSS-adjacent
 * code alike without pulling anything into the bundle unnecessarily.
 *
 * Every token is a plain Tailwind utility string with **no colour values**, so
 * importing from here never touches the light/dark colour system.
 *
 * Usage:
 *   import { containment, cx } from "@/config/containment";
 *   <section className={cx(containment.container, containment.section)} />
 */

const containmentTokens = {
  /**
   * Root route wrapper (`src/routes/__root.tsx`). `overflow-x-clip` (rather than
   * `hidden`) keeps `position: sticky` descendants — the header — working while
   * still refusing to let a child widen the page.
   */
  routeRoot: "relative w-full max-w-full overflow-x-clip",

  /** Same clipping contract for `AppShell`, which wraps every real page. */
  shell: "relative w-full max-w-full overflow-x-clip",

  /** Default content column: centred, capped, with a responsive gutter. */
  container: "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8",

  /** Reading-width column for prose-heavy sections (story, breakdowns). */
  containerNarrow: "mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8",

  /** Full-bleed-ish column for wide grids (deck + browsable list). */
  containerWide: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",

  /**
   * Vertical rhythm only. Deliberately carries no `max-w-*` so it can be
   * composed after any of the container tokens without fighting their cap.
   */
  section: "relative w-full py-12 sm:py-16 lg:py-20",

  /** Generic card: never wider than its grid cell, never leaks its children. */
  card: "min-w-0 max-w-full overflow-hidden",

  /**
   * Rainbow-hairline variant: the outer element keeps the gradient border, so it
   * must NOT clip — the inner panel owns `overflow-hidden` instead.
   */
  cardRainbowSafe: "min-w-0 max-w-full",

  /** Swipe-deck viewport. Clips dragged cards and locks horizontal overscroll. */
  deck: "relative w-full max-w-full overflow-hidden touch-pan-y overscroll-x-contain",

  /** Absolute-positioned swipe card that clips its own drag transform. */
  deckCard:
    "absolute inset-0 min-w-0 w-full max-w-full overflow-hidden will-change-transform",

  /** Horizontal scroller (tab rails, chip rows): never widens the document. */
  scrollX: "w-full max-w-full overflow-x-auto overscroll-x-contain",

  /** Long-text safety: wraps anywhere instead of pushing the layout wider. */
  textWrap: "min-w-0 break-words [overflow-wrap:anywhere]",

  /** Single-line ellipsis that still shrinks correctly inside flex rows. */
  truncate: "min-w-0 truncate",

  /** Sticky stacking helper for section headers inside the shell. */
  stickyTop: "sticky top-0 z-30",

  /** Scroll offset that clears the sticky header at every breakpoint. */
  scrollOffset: "scroll-mt-24 sm:scroll-mt-28 lg:scroll-mt-32",
} as const;

/**
 * Frozen token map. Frozen so a consumer can never mutate the shared contract
 * at runtime (e.g. `containment.container = "..."` throws in strict mode).
 */
export const containment = Object.freeze(containmentTokens);

/** Every available token name — handy for tests and exhaustive checks. */
export type ContainmentKey = keyof typeof containment;

/** A token, or anything falsy that should be skipped when composing. */
type ClassValue = string | false | null | undefined;

/**
 * Tiny class-name joiner so consumers compose tokens without template-string
 * drift (no accidental double spaces, no `undefined` in `className`).
 *
 * ```ts
 * cx(containment.container, isWide && containment.containerWide)
 * ```
 */
export function cx(...tokens: ClassValue[]): string {
  return tokens.filter((token): token is string => Boolean(token)).join(" ");
}
