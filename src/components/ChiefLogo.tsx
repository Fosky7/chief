import { cn } from "@/lib/utils";

interface ChiefLogoProps {
  className?: string;
  /** Accessible title for the logo. */
  title?: string;
  /** When true the logo is hidden from assistive tech (e.g. when next to visible text). */
  decorative?: boolean;
}

/**
 * Chief logo — an Igbo chief's red cap (okpu nze): a tall, near-cylindrical
 * cap with a softly domed crown, a light uli-patterned base band, and an eagle
 * feather rising from the band on the right side.
 * Colors come exclusively from design tokens via Tailwind fill/stroke classes.
 * Only three diamonds are used so the band stays crisp at 16px.
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

      <g>
        {/* Eagle feather — rises from the band, behind the cap's right side */}
        <path
          d="M32.5 34 C 34 24, 38 13, 45 3 C 45.6 13, 42.2 24, 36.2 34.5 Z"
          className="fill-foreground"
        />
        {/* Quill line */}
        <path
          d="M34.4 33.5 C 36.4 24, 39.8 14, 44.4 5"
          className="stroke-primary-foreground"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />

        {/* Cap body — tall, near-vertical sides with a softly domed crown */}
        <path
          d="M10 41 L 10.8 14 C 11 10, 16.5 7.5, 23 7.5 C 29.5 7.5, 35 10, 35.2 14 L 36 41 C 29 44, 17 44, 10 41 Z"
          className="fill-primary"
        />

        {/* Crown highlight for depth */}
        <path
          d="M14.2 13 C 16 10.8, 19.5 10, 23 10"
          className="stroke-primary-foreground"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />

        {/* Patterned base band */}
        <path
          d="M10.2 33.5 C 17 35.5, 29 35.5, 35.8 33.5 L 36 39.5 C 29 41.8, 17 41.8, 10 39.5 Z"
          className="fill-primary-foreground"
        />

        {/* Uli-style diamond motifs (kept to 3 for small-size legibility) */}
        <g className="fill-primary">
          <path d="M12.6 36.8 L 14.6 34.9 L 16.6 36.8 L 14.6 38.7 Z" />
          <path d="M19 37.2 L 21 35.3 L 23 37.2 L 21 39.1 Z" />
          <path d="M25.4 37.2 L 27.4 35.3 L 29.4 37.2 L 27.4 39.1 Z" />
        </g>

        {/* Feather base tucked into the band */}
        <path d="M32.4 32.6 L 36.2 33.2 L 35.7 38.2 L 32.2 37.6 Z" className="fill-foreground" />
      </g>
    </svg>
  );
}

type WordmarkSize = "sm" | "md" | "lg";

const textSizes: Record<WordmarkSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
};

const logoSizes: Record<WordmarkSize, string> = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

interface ChiefWordmarkProps {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  /** Overall size of logo + text. Defaults to "md". */
  size?: WordmarkSize;
  /** Tailwind gap class between logo and text, e.g. "gap-1.5". Defaults to "gap-2". */
  gap?: string;
  /** Whether to render the "Chief" text next to the logo. Defaults to true. */
  showText?: boolean;
}

/** Logo + "Chief" text, the single source of truth for header and footer branding. */
export function ChiefWordmark({
  className,
  logoClassName,
  textClassName,
  size = "md",
  gap = "gap-2",
  showText = true,
}: ChiefWordmarkProps) {
  return (
    <span className={cn("inline-flex items-center", gap, className)}>
      <ChiefLogo decorative={showText} className={cn(logoSizes[size], logoClassName)} />
      {showText && (
        <span className={cn("font-bold tracking-tight text-foreground", textSizes[size], textClassName)}>
          Chief
        </span>
      )}
    </span>
  );
}

export default ChiefLogo;
