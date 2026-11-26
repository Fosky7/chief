import { useId, type CSSProperties, type HTMLAttributes, type SVGProps } from "react";

/**
 * Chief brand mark: a graduation cap resting on a rounded gradient tile.
 *
 * - Decorative by default (aria-hidden="true") because it is normally placed
 *   inside a link/heading that already carries an accessible name.
 * - Pass `title` to expose it as an image with an accessible name.
 * - The tile uses the app's own `bg-brand-gradient` utility so its colours are
 *   always exactly the shared brand tokens (same gradient as the rest of the
 *   site) instead of a locally re-declared gradient.
 * - Rendered as a block-level box so the mark never adds an inline baseline
 *   gap inside the header / dropdown rows.
 */
export type ChiefLogoProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  /** Pixel size (width & height). Defaults to 32. */
  size?: number | string;
  /** Accessible title; when set the logo is announced as an image. */
  title?: string;
  /** Force decorative rendering (aria-hidden). */
  decorative?: boolean;
  // Tolerate legacy/extra props used by older call sites without breaking the build.
  [key: string]: unknown;
};

const LEGACY_PROP_KEYS = ["withWordmark", "showWordmark", "variant", "tone", "animated"] as const;

// Props that only make sense on an <svg> root; they are invalid on the wrapper.
const SVG_ONLY_PROP_KEYS = [
  "xmlns",
  "viewBox",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeLinecap",
  "strokeLinejoin",
] as const;

function toCssSize(size: number | string): string {
  return typeof size === "number" ? `${size}px` : size;
}

export function ChiefLogo(props: ChiefLogoProps) {
  const { size = 32, title, decorative, className, style, ...rawRest } = props;
  const rest: Record<string, unknown> = { ...rawRest };
  for (const key of LEGACY_PROP_KEYS) delete rest[key];
  for (const key of SVG_ONLY_PROP_KEYS) delete rest[key];

  const uid = useId().replace(/:/g, "");
  const titleId = `chief-logo-title-${uid}`;

  const isDecorative = decorative === true || !title;
  const a11y = isDecorative
    ? { "aria-hidden": (rest["aria-hidden"] as boolean | "true" | "false" | undefined) ?? "true" }
    : { role: "img" as const, "aria-labelledby": titleId };

  const classNameStr = typeof className === "string" ? className : "";
  // A call site that supplies its own height/width utility (e.g. "h-6 w-6")
  // controls the size; otherwise the `size` prop sets it.
  const sizedByClass = /(^|\s)(h-|w-|size-)/.test(classNameStr);
  const boxStyle: CSSProperties = sizedByClass ? {} : { width: toCssSize(size), height: toCssSize(size) };

  return (
    <span
      className={["block shrink-0", classNameStr].join(" ").trim()}
      style={{ display: "block", flexShrink: 0, ...boxStyle, ...(style as CSSProperties) }}
      {...(rest as HTMLAttributes<HTMLSpanElement>)}
      {...a11y}
      data-testid="chief-logo"
    >
      {!isDecorative && (
        <span id={titleId} className="sr-only">
          {title}
        </span>
      )}
      {/* Tile: same brand gradient utility the rest of the app uses. */}
      <span className="bg-brand-gradient flex h-full w-full items-center justify-center overflow-hidden rounded-[30%] ring-1 ring-inset ring-white/25">
        <svg
          viewBox="0 0 40 40"
          width="100%"
          height="100%"
          fill="none"
          aria-hidden="true"
          focusable="false"
          className="block"
        >
          {/* Graduation cap */}
          <path d="M20 11.5 7.5 17.6 20 23.7l12.5-6.1L20 11.5Z" fill="#ffffff" />
          <path
            d="M12.6 20.4v5.1c0 1.9 3.3 3.9 7.4 3.9s7.4-2 7.4-3.9v-5.1L20 24l-7.4-3.6Z"
            fill="#ffffff"
            fillOpacity="0.85"
          />
          {/* Tassel */}
          <path d="M31.2 18.3v6.4" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="31.2" cy="26.2" r="1.6" className="fill-brand-saffron" />
        </svg>
      </span>
    </span>
  );
}

/** Alias for call sites that refer to the mark explicitly. */
export const ChiefMark = ChiefLogo;

export default ChiefLogo;
