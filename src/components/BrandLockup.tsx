import type { ComponentType, ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { HeaderLogo } from "@/components/HeaderLogo";
import type { ChiefCapLogoSize } from "@/config/chiefCap";
import { logo as logoToken } from "@/config/theme";

/**
 * BrandLockup
 *
 * The brand block painted by the sticky site header: the inline chief's-cap
 * mark (via {@link HeaderLogo} → `BrandMark` → `ChiefCapLogo`) immediately
 * beside the wordmark, both wrapped in the home link.
 *
 * Geometry / test hooks emitted:
 *   - `data-brand-lockup` on the link (ancestry hook),
 *   - `data-header-logo-slot` (+ `data-header-logo` / `data-chief-cap-logo` on
 *     the `<svg>` itself) from `HeaderLogo`,
 *   - `data-header-wordmark` on the app-name text.
 *
 * Nothing here changes routing, colours or the selected model: the words and
 * colours come from the `logo` token / theme classes, and the mark is sized by
 * the caller (`Header.tsx`) through the `size` token.
 */
export interface BrandLockupProps {
  /** Size token for the mark. Defaults to `"md"` (30px). */
  size?: ChiefCapLogoSize | undefined;
  /** Link target. Defaults to the landing route. */
  to?: string | undefined;
  /** Extra classes for the link wrapper. */
  className?: string | undefined;
  /** Extra classes for the link element itself. */
  linkClassName?: string | undefined;
  /** Render the app-name text beside the mark. Defaults to true. */
  showWordmark?: boolean | undefined;
  /** Any further props are tolerated and ignored (call-site compatibility). */
  [key: string]: unknown;
}

/** Pixel size for each mark token; the header uses `"md"` (30px). */
const MARK_SIZE_BY_TOKEN: Record<string, number> = {
  "2xs": 18,
  xs: 20,
  sm: 24,
  md: 30,
  lg: 36,
  xl: 44,
};

const FALLBACK_BRAND_NAME = "Chief";

/**
 * Typed escape hatch around TanStack's route-aware `<Link />`: the lockup link
 * is always a plain string target supplied by the header.
 */
const BrandLink = Link as unknown as ComponentType<{
  to: string;
  className?: string;
  "data-brand-lockup"?: string;
  children?: ReactNode;
}>;

function firstNonEmpty(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return undefined;
}

const logoRecord = logoToken as unknown as {
  wordmark?: unknown;
  name?: unknown;
};

/** App name shown beside the mark. */
const BRAND_NAME =
  firstNonEmpty(logoRecord?.wordmark, logoRecord?.name) ?? FALLBACK_BRAND_NAME;

export function BrandLockup({
  size = "md",
  to = "/",
  className,
  linkClassName,
  showWordmark = true,
}: BrandLockupProps) {
  const markSize = MARK_SIZE_BY_TOKEN[String(size)] ?? MARK_SIZE_BY_TOKEN.md;

  const mergedLinkClassName = [
    "inline-flex min-w-0 items-center gap-2",
    className,
    linkClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <BrandLink
      to={to}
      data-brand-lockup=""
      className={mergedLinkClassName}
    >
      <HeaderLogo size={markSize} />
      {showWordmark ? (
        <span
          data-header-wordmark=""
          className="select-none text-base font-semibold tracking-tight text-foreground"
        >
          {BRAND_NAME}
        </span>
      ) : null}
    </BrandLink>
  );
}

export default BrandLockup;
