import { BrandMark } from "@/components/BrandMark";
import { logo } from "@/config/theme";

/**
 * Header brand lockup.
 *
 * A visibility guard around `<BrandMark />` for the top header: the wrapper is
 * `inline-flex` with an explicit (non-zero) width/height, never `hidden` /
 * `sr-only` / `opacity-0`, so the labelled logo renders at phone AND desktop
 * widths. All colour and geometry come from the `logo` tokens — nothing is
 * hard-coded.
 *
 * The mark is always named ("ChiefCap logo"): the name is forwarded as
 * `title`, `label` and `aria-label`, `decorative={false}` is forced, and the
 * `data-header-logo` / `data-chief-cap-logo` hooks are always emitted, so the
 * `<svg role="img" aria-label="ChiefCap logo">` is exposed to assistive tech
 * and measurable by the header geometry band and the verification specs.
 */
export interface HeaderLogoProps {
  /** Rendered size in px. Defaults to a header-appropriate 30px. */
  size?: number | undefined;
  /** Extra classes for the wrapper (layout only — never visibility). */
  className?: string | undefined;
}

const DEFAULT_HEADER_LOGO_SIZE = 30;

/** Minimum px the wrapper will ever occupy, even if CSS tries to shrink it. */
const MIN_HEADER_LOGO_SIZE = 18;

/** Last-resort name; kept in sync with the `logo.accessibleName` token. */
const FALLBACK_ACCESSIBLE_NAME = "ChiefCap logo";

/** Classes that must never be added to the header logo wrapper. */
const HIDING_CLASSES = /(^|\s)(hidden|sr-only|invisible|opacity-0)(\s|$)/;

/** Resolve the accessible name from the single token of truth. */
function resolveAccessibleName(): string {
  const tokenName =
    logo && typeof logo.accessibleName === "string"
      ? logo.accessibleName.trim()
      : "";
  return tokenName.length > 0 ? tokenName : FALLBACK_ACCESSIBLE_NAME;
}

export function HeaderLogo({
  size = DEFAULT_HEADER_LOGO_SIZE,
  className,
}: HeaderLogoProps) {
  const px =
    Number.isFinite(size) && size > 0
      ? Math.round(size)
      : DEFAULT_HEADER_LOGO_SIZE;

  const accessibleName = resolveAccessibleName();

  const safeClassName =
    className && !HIDING_CLASSES.test(className) ? className : undefined;

  const mergedClassName = [
    "inline-flex shrink-0 items-center justify-center align-middle leading-none",
    safeClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      data-header-logo-slot=""
      data-header-logo-wrapper=""
      className={mergedClassName}
      style={{
        display: "inline-flex",
        width: px,
        height: px,
        minWidth: MIN_HEADER_LOGO_SIZE,
        minHeight: MIN_HEADER_LOGO_SIZE,
        visibility: "visible",
        opacity: 1,
        flex: "0 0 auto",
      }}
    >
      <BrandMark
        size="md"
        width={px}
        height={px}
        title={accessibleName}
        label={accessibleName}
        aria-label={accessibleName}
        decorative={false}
        role="img"
        data-header-logo
        data-chief-cap-logo
        className="block"
      />
    </span>
  );
}

export default HeaderLogo;
