/**
 * Chief — Igbo traditional chief's cap (okpu agu) logo tokens.
 *
 * Why this file exists
 * --------------------
 * The header mark is an inline SVG, so every one of its fills and strokes must
 * resolve from the same palette as the rest of the app — never a hardcoded
 * hex value. This module is the single source of truth for that palette and
 * for the logo's ready-made Tailwind class strings, in the same style as the
 * `gradients` / `surfaces` token blocks in `src/config/theme.ts`.
 *
 * It lives in its own module (rather than being appended to `theme.ts`)
 * purely so an additive change can never disturb the existing exports there.
 * Consumers import from here, or re-export it from `theme.ts` if a single
 * import surface is ever preferred:
 *
 *   export { chiefCapTokens, chiefCapLogoClasses } from "./chiefCap";
 *
 * Fallback contract
 * -----------------
 * Every colour is expressed as `hsl(var(--token, <literal fallback>))` (plus
 * an optional alpha channel). If a brand ramp is renamed, dropped or never
 * shipped, the literal inside `var()` keeps the cap rendering correctly, so
 * the header logo can never turn into an invisible/black rectangle after a
 * future palette pass.
 *
 * Colourless by construction: the component that consumes these tokens owns
 * no colour literals of its own.
 */

/**
 * The complete colour contract for the chief-cap mark.
 *
 * Explicit (rather than inferred) so a typo in a consumer is a compile error
 * instead of a silently `undefined` `fill` attribute.
 */
export interface ChiefCapTokens {
  /** Deep red fez crown — the dominant shape of the cap. */
  readonly crown: string;
  /** Darker red used for the base shadow / grounding line. */
  readonly crownShade: string;
  /** Low-alpha lighter red that reads as a vertical sheen on the crown. */
  readonly crownHighlight: string;
  /** Ivory / white lower band at the brim. */
  readonly bandIvory: string;
  /** Slightly darker ivory for the feather's spine and shading. */
  readonly bandIvoryShade: string;
  /** Eagle-feather body (warm white, a touch brighter than the band). */
  readonly feather: string;
  /** Eagle-feather spine / shading. */
  readonly featherShade: string;
  /** Gold embroidery band running around the base of the crown. */
  readonly gold: string;
  /** Deeper gold for the medallion ring and embroidery outline. */
  readonly goldDeep: string;
  /** Subtle silhouette stroke so the cap stays legible on light and dark. */
  readonly outline: string;
  /** Hairline used around the ivory band. */
  readonly ring: string;
}

/**
 * Cap palette.
 *
 * Ramps used (all with literal hsl fallbacks): `--brand-rose` (crown),
 * `--brand-rose-ink` (crown shade), `--brand-ivory` / `--brand-ivory-shade`
 * (band + feather), `--brand-amber` / `--brand-amber-ink` (gold embroidery),
 * `--foreground` (outline) and `--border` (ring).
 */
export const chiefCapTokens: ChiefCapTokens = {
  crown: "hsl(var(--brand-rose, 350 78% 45%))",
  crownShade: "hsl(var(--brand-rose-ink, 349 72% 34%))",
  crownHighlight: "hsl(var(--brand-rose, 350 82% 62%) / 0.45)",
  bandIvory: "hsl(var(--brand-ivory, 40 55% 96%))",
  bandIvoryShade: "hsl(var(--brand-ivory-shade, 38 30% 82%))",
  feather: "hsl(var(--brand-ivory, 40 58% 97%))",
  featherShade: "hsl(var(--brand-ivory-shade, 38 26% 74%))",
  gold: "hsl(var(--brand-amber, 38 92% 52%))",
  goldDeep: "hsl(var(--brand-amber-ink, 32 84% 38%))",
  outline: "hsl(var(--foreground, 240 10% 12%) / 0.55)",
  ring: "hsl(var(--border, 240 6% 82%) / 0.9)",
};

/**
 * The sizes the mark is allowed to render at.
 *
 * - `xs` — tiny lockup / dense mobile chrome (mark-only brand rail).
 * - `sm` — compact chrome, inline mentions, list rows.
 * - `md` — the default header size and the canonical standalone mark.
 * - `lg` — display surfaces (empty states, not-found, footer hero lockups).
 */
export type ChiefCapLogoSize = "xs" | "sm" | "md" | "lg";

/**
 * Per-size pixel caps for the mark.
 *
 * Written down explicitly (rather than being inferred from Tailwind at
 * runtime) so the geometry contract is greppable and reviewable:
 *
 * | size | px | Tailwind   | vs `--logo-size` band (`header-nav.css`) |
 * |------|----|------------|------------------------------------------|
 * | xs   | 20 | `size-5`   | below the smallest header band (24px)    |
 * | sm   | 24 | `size-6`   | equal to the smallest header band        |
 * | md   | 28 | `size-7`   | ≤ default header band (28–32px)          |
 * | lg   | 36 | `size-9`   | ≤ largest header band (32–36px)          |
 *
 * Inside the sticky header the `--logo-size` token wins (higher specificity),
 * but it is banded to stay ≤ these numbers, so the mark can never push
 * `--header-height` — and therefore `layout.headerOffset` — out of sync.
 */
export const chiefCapLogoPixels: Readonly<
  Record<ChiefCapLogoSize, number>
> = {
  xs: 20,
  sm: 24,
  md: 28,
  lg: 36,
};

/**
 * Ready-made Tailwind class strings for the mark.
 *
 * `sizes` are sensible standalone defaults (footer, empty states). Inside the
 * sticky header the geometry layer (`src/styles/header-nav.css`, the
 * `--logo-size` token) takes over and keeps the mark inside
 * `--header-brand-row`, so the header never grows taller than
 * `layout.headerOffset` expects.
 */
export const chiefCapLogoClasses = {
  /** Applied to every instance: never shrink, never selectable. */
  base: "shrink-0 select-none align-middle",
  /** Square sizes (Tailwind's `size-*` sets width *and* height). */
  sizes: {
    xs: "size-5",
    sm: "size-6",
    md: "size-7",
    lg: "size-9",
  },
} as const satisfies {
  readonly base: string;
  readonly sizes: Readonly<Record<ChiefCapLogoSize, string>>;
};

/**
 * Rounded pill backdrop that can be placed *behind* the mark at larger
 * display sizes (not-found page, footer hero, marketing blocks).
 *
 * The mark itself is transparent and assumes it sits on the app's card
 * surface; the badge is an opt-in affordance for surfaces where the cap would
 * otherwise float on a busy gradient. Colours are token-driven (`bg-muted`,
 * `ring-border`) so light/dark/print all follow the palette with no literals
 * here either.
 */
export const chiefCapBadgeClasses = {
  /** Always applied to the badge wrapper. */
  base: "inline-flex items-center justify-center rounded-full",
  /** Neutral, low-contrast fill + hairline, both from theme tokens. */
  tone: "bg-muted/60 ring-1 ring-border/60",
  /** Badge wrapper sizes, always one notch larger than the mark it holds. */
  sizes: {
    xs: "size-6",
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  },
} as const satisfies {
  readonly base: string;
  readonly tone: string;
  readonly sizes: Readonly<Record<ChiefCapLogoSize, string>>;
};

/**
 * Convenience helper: the full class string for a badge at a given size.
 *
 * Kept as a function so call sites stay short and cannot forget the base or
 * tone classes:
 *
 *   <span className={chiefCapBadgeClass("lg")}>
 *     <ChiefCapLogo size="lg" decorative />
 *   </span>
 */
export function chiefCapBadgeClass(size: ChiefCapLogoSize = "md"): string {
  return [
    chiefCapBadgeClasses.base,
    chiefCapBadgeClasses.tone,
    chiefCapBadgeClasses.sizes[size],
  ].join(" ");
}

export default chiefCapTokens;
