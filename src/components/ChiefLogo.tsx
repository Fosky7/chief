import { cn } from "@/lib/utils";

interface ChiefLogoProps {
  className?: string;
  /** Accessible title for the logo. */
  title?: string;
  /** When true the logo is hidden from assistive tech (e.g. when next to visible text). */
  decorative?: boolean;
}

/**
 * Chief logo — an Igbo chief's cap (okpu nze / red cap) with a decorative
 * patterned band and an eagle feather tucked into its side.
 * Colors come exclusively from design tokens via Tailwind fill/stroke classes.
 */
export function ChiefLogo({ className, title = "Chief", decorative = false }: ChiefLogoProps) {
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": title } as const);

  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-8 shrink-0", className)}
      data-testid="chief-logo"
      {...a11y}
    >
      {!decorative && <title>{title}</title>}

      {/* Eagle feather (quill) rising diagonally behind the cap's right side */}
      <g className="fill-foreground">
        <path d="M30 26 C 33 17, 38 9, 44 3 C 43 11, 39 19, 33 27 Z" />
      </g>
      <path
        d="M31.5 26 L 43 5"
        className="stroke-primary-foreground"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />

      {/* Cap body: slightly tapered cylinder with a softly rounded crown */}
      <path
        d="M9 41 L 11 18 C 11.3 13, 17 11, 24 11 C 31 11, 36.7 13, 37 18 L 39 41 C 33 43, 15 43, 9 41 Z"
        className="fill-primary"
      />

      {/* Crown highlight for depth */}
      <path
        d="M14 17 C 16 14.5, 20 13.6, 24 13.6"
        className="stroke-primary-foreground"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />

      {/* Decorative band near the base */}
      <path
        d="M9.6 33.5 C 16 35, 32 35, 38.4 33.5 L 38.8 38.5 C 32 40, 16 40, 9.2 38.5 Z"
        className="fill-primary-foreground"
        opacity="0.9"
      />

      {/* Traditional diamond motifs on the band */}
      <g className="fill-primary">
        <path d="M14 36.4 L 15.6 34.9 L 17.2 36.4 L 15.6 37.9 Z" />
        <path d="M20.4 36.6 L 22 35.1 L 23.6 36.6 L 22 38.1 Z" />
        <path d="M26.4 36.6 L 28 35.1 L 29.6 36.6 L 28 38.1 Z" />
        <path d="M32.8 36.4 L 34.4 34.9 L 36 36.4 L 34.4 37.9 Z" />
      </g>

      {/* Feather base tucked into the cap */}
      <path d="M29.5 27.5 L 33.5 25.5 L 33 29 Z" className="fill-foreground" />
    </svg>
  );
}

interface ChiefWordmarkProps {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
}

/** Logo + "Chief" text, for header and footer use. */
export function ChiefWordmark({ className, logoClassName, textClassName }: ChiefWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ChiefLogo decorative className={logoClassName} />
      <span className={cn("text-lg font-bold tracking-tight text-foreground", textClassName)}>Chief</span>
    </span>
  );
}

export default ChiefLogo;
