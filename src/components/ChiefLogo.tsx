import { cn } from "@/lib/utils";

interface ChiefLogoProps {
  className?: string;
  /** Accessible title for the logo. */
  title?: string;
  /** When true the logo is hidden from assistive tech (e.g. when next to visible text). */
  decorative?: boolean;
}

/**
 * Chief logo — an Igbo chief's red cap (okpu nze) with a patterned uli-style
 * band and an eagle feather tucked into its right side.
 * Colors come exclusively from design tokens via Tailwind fill/stroke classes.
 * Shapes are kept bold and simple so the mark stays legible at 16–32px.
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
        {/* Eagle feather — tall, rising behind the cap's right side */}
        <path
          d="M29 31 C 31 21, 36 11, 44 2 C 44.5 12, 40 23, 34 32 Z"
          className="fill-foreground"
        />
        {/* Quill line */}
        <path
          d="M31.2 31 C 34 21, 38.5 12, 43.4 4"
          className="stroke-primary-foreground"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />

        {/* Cap body — soft, rounded cylinder (the red cap) */}
        <path
          d="M8.5 40 C 8.5 32, 9.5 24, 10.5 19 C 11.5 13, 17 10.5, 24 10.5 C 31 10.5, 36.5 13, 37.5 19 C 38.5 24, 39.5 32, 39.5 40 C 33 43.5, 15 43.5, 8.5 40 Z"
          className="fill-primary"
        />

        {/* Crown highlight for depth */}
        <path
          d="M14 17.5 C 16 14.6, 20 13.4, 24 13.4"
          className="stroke-primary-foreground"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />

        {/* Patterned base band */}
        <path
          d="M8.9 33 C 16 35, 32 35, 39.1 33 L 39.4 38.6 C 32 40.8, 16 40.8, 8.6 38.6 Z"
          className="fill-primary-foreground"
        />

        {/* Uli-style diamond motifs */}
        <g className="fill-primary">
          <path d="M13.4 36.3 L 15.2 34.6 L 17 36.3 L 15.2 38 Z" />
          <path d="M20.2 36.6 L 22 34.9 L 23.8 36.6 L 22 38.3 Z" />
          <path d="M26.2 36.6 L 28 34.9 L 29.8 36.6 L 28 38.3 Z" />
          <path d="M33 36.3 L 34.8 34.6 L 36.6 36.3 L 34.8 38 Z" />
        </g>

        {/* Feather base tucked into the band */}
        <path d="M29 31 L 34 32 L 33.2 35.4 L 29.6 34.6 Z" className="fill-foreground" />
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
