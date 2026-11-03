import type { CSSProperties, SVGProps } from "react";

import {
  chiefCapLogoClasses,
  chiefCapTokens,
  type ChiefCapLogoSize,
  type ChiefCapTokens,
} from "@/config/chiefCap";
import { logo as logoToken } from "@/config/theme";

/**
 * ChiefCapLogo — the Chief brand mark.
 *
 * A dependency-free inline SVG of an Igbo traditional chief's cap (okpu agu):
 * a tapered deep-red fez crown, a gold embroidery band with a centre medallion
 * and stitching, an ivory brim band that is slightly wider than the crown, and
 * a single upright eagle feather on the right.
 *
 * Every colour comes from `chiefCapTokens` (`hsl(var(--brand-*, fallback))`),
 * so light mode, dark mode and any future palette pass all flow through
 * unchanged. Purely presentational: no hooks, no state, no `window` access —
 * SSR-safe with zero hydration risk.
 *
 * Accessibility
 * -------------
 * The mark is ALWAYS named: the accessible name is resolved as
 * `firstNonEmpty(aria-label, title, label, logo.accessibleName, "ChiefCap logo")`
 * and the root `<svg>` always renders `role="img"`, `aria-label={name}` and a
 * single `<title>{name}</title>`. There is no anonymous/decorative path, so the
 * header mark can never drop out of `svg[aria-label*="logo" i]` matches.
 *
 * Sizing
 * ------
 * Accepts either a `ChiefCapLogoSize` token (`"sm" | "md" | ...`) or a plain
 * numeric pixel size. Untyped SVG props (`width`, `height`, `role`,
 * `aria-label`, `aria-hidden`, `style`, data hooks, ...) are forwarded onto the
 * root `<svg>` so callers can size/name the mark without prop-type errors.
 */

export interface ChiefCapLogoProps
  extends Omit<SVGProps<SVGSVGElement>, "title" | "width" | "height"> {
  /** Extra Tailwind classes merged onto the root `<svg>`. */
  className?: string | undefined;
  /** Square size: a size token or a numeric pixel size. Defaults to `"md"`. */
  size?: ChiefCapLogoSize | number | undefined;
  /** Accessible name. Providing it exposes the mark to assistive tech. */
  title?: string | undefined;
  /** Alias for `title`; also exposes the mark to assistive tech. */
  label?: string | undefined;
  /** Accepted for API compatibility; the mark is always named. */
  decorative?: boolean | undefined;
  /** Explicit rendered width (px number or any CSS length). */
  width?: number | string | undefined;
  /** Explicit rendered height (px number or any CSS length). */
  height?: number | string | undefined;
  /**
   * Hook for the header geometry layer, which sizes the mark from the
   * `--logo-size` token so it can never outgrow `--header-brand-row`.
   * Defaults to on so any consumer inside the header is styled consistently.
   */
  "data-header-logo"?: boolean | undefined;
  /** Stable hook identifying the inline brand mark (defaults to on). */
  "data-chief-cap-logo"?: boolean | undefined;
}

/**
 * Canonical accessible name, used whenever a stale or missing branding token is
 * encountered. Kept in sync with HeaderLogo and BrandMark.
 */
const FALLBACK_ACCESSIBLE_NAME = "ChiefCap logo";

/** Default painted size when no explicit width/height is supplied. */
const DEFAULT_PIXEL_SIZE = 48;

/** Tiny class-name joiner — avoids pulling in a utility for one call site. */
function joinClassNames(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Pick the first non-empty, trimmed string from the supplied candidates.
 * Whitespace-only strings carry no information and must never be used.
 */
function firstNonEmpty(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return undefined;
}

function normalizeAccessibleName(name: string | undefined): string {
  return name === FALLBACK_ACCESSIBLE_NAME ? name : FALLBACK_ACCESSIBLE_NAME;
}

/** Normalise a numeric px / CSS length into something `style` accepts. */
function toCssLength(value?: number | string): string | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? `${value}px` : undefined;
  }
  return value;
}

/**
 * Stitching marks along the gold embroidery band.
 *
 * Static data (not generated at render time) so the DOM is stable across
 * server and client renders. The medallion occupies the centre, so the
 * stitches are symmetric around it and skip that gap.
 */
const EMBROIDERY_STITCHES: ReadonlyArray<number> = [
  16.6, 17.9, 19.2, 20.5, 27.5, 28.8, 30.1, 31.4,
];

export function ChiefCapLogo({
  className,
  size = "md",
  title,
  label,
  width,
  height,
  "data-header-logo": headerLogoHook = true,
  "data-chief-cap-logo": chiefCapLogoHook = true,
  "aria-label": ariaLabelProp,
  role: roleProp,
  style: styleProp,
  ...rest
}: ChiefCapLogoProps) {
  const cap: ChiefCapTokens = chiefCapTokens;

  // --- sizing -------------------------------------------------------------
  const numericSize =
    typeof size === "number" && Number.isFinite(size) && size > 0
      ? size
      : undefined;
  const sizeToken: ChiefCapLogoSize = typeof size === "string" ? size : "md";

  const pixelWidth = width ?? numericSize;
  const pixelHeight = height ?? numericSize;

  const resolvedWidth = width ?? numericSize ?? DEFAULT_PIXEL_SIZE;
  const resolvedHeight = height ?? numericSize ?? DEFAULT_PIXEL_SIZE;

  const sizeStyle: CSSProperties | null =
    pixelWidth !== undefined || pixelHeight !== undefined
      ? { width: toCssLength(pixelWidth), height: toCssLength(pixelHeight) }
      : null;

  // Inline geometry keeps the mark paintable even if a stylesheet rule tries
  // to collapse it; `visibility`/`opacity` keep it on screen at every width.
  const resolvedStyle: CSSProperties = {
    flexShrink: 0,
    visibility: "visible",
    opacity: 1,
    ...(sizeStyle ?? {}),
    ...(styleProp ?? {}),
  };

  // --- accessible name (always present) -----------------------------------
  const accessibleName = normalizeAccessibleName(
    firstNonEmpty(ariaLabelProp, title, label, logoToken?.accessibleName),
  );

  return (
    <svg
      {...rest}
      viewBox="0 0 48 48"
      width={resolvedWidth}
      height={resolvedHeight}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={joinClassNames(
        chiefCapLogoClasses?.base,
        chiefCapLogoClasses?.sizes?.[sizeToken],
        className,
      )}
      data-chief-cap-logo={chiefCapLogoHook ? "" : undefined}
      data-header-logo={headerLogoHook ? "" : undefined}
      role={roleProp ?? "img"}
      aria-label={accessibleName}
      focusable="false"
      style={resolvedStyle}
    >
      <title>{accessibleName}</title>

      {/**
       * The artwork is drawn in a 48×48 grid and then nudged 2px left / 3px
       * down so the optical centre of the cap (which the upright feather pulls
       * up and to the right) lands on the centre of the box.
       */}
      <g transform="translate(-2 3)">
        {/* Soft grounding shadow under the brim — reads as the cap resting. */}
        <ellipse
          cx="24"
          cy="35"
          rx="9.4"
          ry="1.05"
          fill={cap.crownShade}
          opacity="0.2"
        />

        {/* Eagle feather — drawn first so its base tucks behind the crown. */}
        <path
          d="M31.2 20.3 C32.5 14.7 34.9 9.6 39.4 4.4 C41 9.7 39.7 15.9 36 20.6 C34.1 22.4 31.9 22.1 31.2 20.3 Z"
          fill={cap.feather}
          stroke={cap.outline}
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        {/* Feather spine. */}
        <path
          d="M32.5 20.8 C34.3 15.7 36.3 11.2 38.8 6.3"
          fill="none"
          stroke={cap.featherShade}
          strokeWidth="0.7"
          strokeLinecap="round"
        />

        {/* Tapered fez crown — narrower at the top, wider at the brim. */}
        <path
          d="M14.3 31.8 C15.4 24.6 17.1 15.4 18.9 11.6 C19.3 10.3 20.3 9.5 21.6 9.5 L26.4 9.5 C27.7 9.5 28.7 10.3 29.1 11.6 C30.9 15.4 32.6 24.6 33.7 31.8 Z"
          fill={cap.crown}
          stroke={cap.outline}
          strokeWidth="1.1"
          strokeLinejoin="round"
        />

        {/* Top of the fez — a faint ellipse gives the crown volume. */}
        <ellipse
          cx="24"
          cy="10.7"
          rx="4.5"
          ry="1.05"
          fill={cap.crownShade}
          opacity="0.3"
        />

        {/* Vertical sheen on the left of the crown. */}
        <path
          d="M19.5 30.7 C20.3 24.2 21.2 17.6 22.2 12 L24.4 12 C23.4 18 22.8 24.4 22.4 30.7 Z"
          fill={cap.crownHighlight}
        />

        {/* Gold embroidery band + centre medallion. */}
        <rect
          x="15.4"
          y="28.3"
          width="17.2"
          height="2.3"
          rx="1.15"
          fill={cap.gold}
          stroke={cap.goldDeep}
          strokeWidth="0.4"
        />

        {/* Stitching marks either side of the medallion. */}
        {EMBROIDERY_STITCHES.map((x) => (
          <line
            key={x}
            x1={x}
            y1="29"
            x2={x}
            y2="29.9"
            stroke={cap.goldDeep}
            strokeWidth="0.35"
            strokeLinecap="round"
            opacity="0.75"
          />
        ))}

        <circle
          cx="24"
          cy="29.45"
          r="1.4"
          fill={cap.gold}
          stroke={cap.goldDeep}
          strokeWidth="0.5"
        />
        <circle cx="24" cy="29.45" r="0.55" fill={cap.bandIvory} />

        {/* Ivory band at the brim — slightly wider than the crown. */}
        <rect
          x="13.7"
          y="30.4"
          width="20.6"
          height="4.6"
          rx="1.9"
          fill={cap.bandIvory}
          stroke={cap.ring}
          strokeWidth="0.9"
        />

        {/* Hairline shading where the brim meets the crown. */}
        <path
          d="M14.8 31.1 L33.2 31.1"
          stroke={cap.bandIvoryShade}
          strokeWidth="0.6"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}

export default ChiefCapLogo;
