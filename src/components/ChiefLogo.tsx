import type { SVGProps } from "react";

export type ChiefLogoProps = SVGProps<SVGSVGElement> & { size?: number; decorative?: boolean };

export function ChiefLogo({ size = 28, className, decorative = false, ...props }: ChiefLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : "Chief logo"}
      data-testid="chief-logo"
      {...props}
    >
      <title>Chief</title>
      <path d="M14 34c0-10 8-18 18-18s18 8 18 18v2H14v-2z" fill="currentColor" />
      <path d="M10 38h44a2 2 0 0 1 0 4H10a2 2 0 0 1 0-4z" fill="currentColor" opacity="0.8" />
      <circle cx="32" cy="14" r="3" fill="currentColor" />
    </svg>
  );
}

export default ChiefLogo;
