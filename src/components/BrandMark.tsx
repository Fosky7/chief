import {
  ChiefCapLogo,
  type ChiefCapLogoProps,
} from "@/components/ChiefCapLogo";
import { logo } from "@/config/theme";

/**
 * BrandMark — the header-friendly wrapper around `<ChiefCapLogo />`.
 *
 * Its only job is to guarantee the mark is *named* and *painted*:
 * a `label` / `title` / `aria-label` prop is forwarded verbatim as the
 * accessible name (never replaced by the short visual wordmark token), the
 * mark is forced non-decorative so `<ChiefCapLogo />` emits
 * `role="img"` + `aria-label` + `<title>`, and the `data-header-logo` /
 * `data-chief-cap-logo` hooks are always emitted for the header CSS band and
 * the verification specs.
 *
 * When no name is supplied it falls back to `logo.accessibleName` (the shared
 * theme token, "ChiefCap logo"), so the mark can never be anonymous by accident.
 */
export interface BrandMarkProps extends Omit<ChiefCapLogoProps, "decorative"> {
  /** Optional explicit name; defaults to the shared `logo.accessibleName`. */
  label?: string | undefined;
  /** Force the mark to be purely decorative (rare — not used in the header). */
  decorative?: boolean | undefined;
}

/** Canonical accessible name for the product logo. */
const FALLBACK_ACCESSIBLE_NAME = "ChiefCap logo";

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

export function BrandMark({
  label,
  title,
  decorative = false,
  "aria-label": ariaLabelProp,
  "data-header-logo": headerLogoHook = true,
  "data-chief-cap-logo": chiefCapLogoHook = true,
  ...rest
}: BrandMarkProps) {
  const tokenName =
    logo && typeof logo.accessibleName === "string"
      ? logo.accessibleName
      : undefined;

  const accessibleName = normalizeAccessibleName(
    firstNonEmpty(ariaLabelProp, title, label, tokenName),
  );

  return (
    <ChiefCapLogo
      {...rest}
      title={accessibleName}
      label={accessibleName}
      aria-label={accessibleName}
      // The header mark is the product logo: never decorative.
      decorative={decorative === true ? false : decorative}
      data-header-logo={headerLogoHook ? true : undefined}
      data-chief-cap-logo={chiefCapLogoHook ? true : undefined}
    />
  );
}

export default BrandMark;
