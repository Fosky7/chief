/**
 * src/components/GradientBand.tsx
 *
 * The shared "tinted band" primitive used by both the home hero and the
 * dashboard hero. It is deliberately small and fully token driven:
 *  - the accent wash, sheen and ring all come from `accentBands` in the theme;
 *  - every decorative layer is `pointer-events-none` + `aria-hidden`;
 *  - `overflow-hidden` + `isolate` keep blurs and sheens contained (no
 *    horizontal overflow leaking into the page shell).
 *
 * Backwards compatible: existing call sites that only pass `accent` render the
 * same shape as before (a rounded, bordered, tinted band wrapping children).
 */

import type { ElementType, HTMLAttributes, ReactNode } from "react";
import {
  accentBand,
  BRAND_KEYS,
  type AccentBand,
  type BrandKey,
} from "@/config/theme";

export type GradientBandAccent = BrandKey;

/** Overall intensity of the accent wash. */
export type GradientBandVariant = "default" | "soft" | "vivid";

/** How many extra sheen layers to stack above the wash. */
export type GradientBandSheen = "none" | "soft" | "strong";

export interface GradientBandProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "className"> {
  /** Brand accent for the band. Defaults to `indigo` (previous behaviour). */
  accent?: GradientBandAccent;
  /** Wash intensity. */
  variant?: GradientBandVariant;
  /** Extra soft radial sheen for a less flat, more crafted feel. */
  sheen?: GradientBandSheen;
  /** Rendered element. Defaults to `section`. */
  as?: ElementType;
  className?: string;
  children?: ReactNode;
}

const join = (...values: Array<string | false | null | undefined>): string =>
  values.filter(Boolean).join(" ");

const isAccent = (value: unknown): value is GradientBandAccent =>
  typeof value === "string" && (BRAND_KEYS as readonly string[]).includes(value);

const WASH_OPACITY: Record<GradientBandVariant, string> = {
  default: "opacity-100",
  soft: "opacity-70",
  vivid: "opacity-100 saturate-150",
};

const SHEEN_DEPTH: Record<GradientBandSheen, number> = {
  none: 0,
  soft: 1,
  strong: 2,
};

export function GradientBand({
  accent = "indigo",
  variant = "default",
  sheen = "soft",
  as,
  className,
  children,
  ...rest
}: GradientBandProps) {
  const Tag = (as ?? "section") as ElementType;
  // Resolve by brand key with a guaranteed fallback — never index the band
  // array with a string (that always yields `undefined` and crashed on
  // `band.ring` / `band.wash` / `band.sheen`).
  const band: AccentBand = accentBand(isAccent(accent) ? accent : "indigo");
  const sheenDepth = SHEEN_DEPTH[sheen] ?? 1;

  return (
    <Tag
      {...rest}
      className={join(
        "relative isolate overflow-hidden rounded-3xl border border-slate-200/70 bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/50",
        band?.ring,
        className,
      )}
    >
      {/* Accent wash */}
      <span
        aria-hidden="true"
        className={join("pointer-events-none absolute inset-0", band?.wash, WASH_OPACITY[variant])}
      />

      {/* Soft sheen layer */}
      {sheenDepth >= 1 ? (
        <span
          aria-hidden="true"
          className={join("pointer-events-none absolute inset-0", band?.sheen)}
        />
      ) : null}

      {/* Diagonal highlight for a stronger sheen */}
      {sheenDepth >= 2 ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-1/4 -top-1/3 h-2/3 rotate-6 bg-[radial-gradient(60%_60%_at_50%_50%,hsl(var(--brand-rose)/0.18),transparent_70%)] blur-2xl"
        />
      ) : null}

      {/* Inner hairline ring — keeps the edge crisp instead of flat */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/50 dark:ring-white/10"
      />

      <div className="relative z-10">{children}</div>
    </Tag>
  );
}

export default GradientBand;
