import { Fragment } from "react";

import {
  gradients,
  layout,
  stepGradient,
  surfaces,
  typography,
} from "@/config/theme";

export interface HowItWorksProps {
  /**
   * Anchor id forwarded from the route (`#how-it-works`). The section also
   * applies `layout.headerOffset` scroll margins so hash navigation and
   * programmatic scrolls stop below the sticky header at every breakpoint.
   */
  id?: string;
  className?: string;
}

interface Step {
  title: string;
  description: string;
}

/**
 * Three steps that explain the whole loop: a verified request lands in the
 * deck → the donor swipes to pledge → the provider is paid in Naira.
 */
const steps: readonly Step[] = [
  {
    title: "Verified requests",
    description:
      "Every bill is matched to a real utility account and confirmed with the provider before it ever reaches the deck.",
  },
  {
    title: "Swipe to pay",
    description:
      "Swipe right on the request you want to back. Your pledge attaches to that exact bill — never a general pot.",
  },
  {
    title: "Paid to the provider",
    description:
      "Once a bill clears, Chief pays the provider directly in Naira and the household's supply stays connected.",
  },
];

/**
 * Per-step colour identity: rose → amber → indigo.
 *
 * Strips and ink colours are expressed as `hsl(var(--token))` arbitrary values
 * (the same convention as `src/config/theme.ts` and the dashboard tiles), so
 * light/dark parity and the brand ramp stay in one place and no raw hex/rgb
 * ever lands in a component.
 */
const stepAccents = [
  {
    strip:
      "bg-[linear-gradient(120deg,hsl(var(--brand-rose)),hsl(var(--brand-amber)))]",
    sheen: gradients.cardSheenRose,
    ink: "text-[hsl(var(--brand-rose-ink))]",
  },
  {
    strip:
      "bg-[linear-gradient(120deg,hsl(var(--brand-amber)),hsl(var(--brand-emerald)))]",
    sheen: gradients.cardSheenAmber,
    ink: "text-[hsl(var(--brand-amber-ink))]",
  },
  {
    strip:
      "bg-[linear-gradient(120deg,hsl(var(--brand-indigo)),hsl(var(--brand-violet)))]",
    sheen: gradients.cardSheenIndigo,
    ink: "text-[hsl(var(--brand-indigo-ink))]",
  },
] as const;

/** Fixed per-index fallbacks used if the shared helper is unavailable. */
const fallbackStepGradients: readonly string[] = stepAccents.map(
  (accent) => accent.strip,
);

/**
 * Resolve the gradient for a numbered circle.
 *
 * `stepGradient(index)` is the source of truth, but older bundles shipped a
 * broken/absent helper ("stepGradient is not a function"). This wrapper keeps
 * the render alive in that case by falling back to a fixed per-index map, and
 * clamps rather than throwing for a hypothetical fourth step.
 */
function resolveStepGradient(index: number): string {
  try {
    if (typeof stepGradient === "function") {
      const value = stepGradient(index);
      if (typeof value === "string" && value.trim().length > 0) return value;
    }
  } catch {
    // Deliberately swallowed: the fallback map below is always safe.
  }

  return (
    fallbackStepGradients[index] ??
    fallbackStepGradients[fallbackStepGradients.length - 1] ??
    gradients.spectrum
  );
}

/**
 * "How it works" — three gradient-identified step cards.
 *
 * Each card is a `surfaces.card` panel with:
 *  - a per-step gradient top strip,
 *  - a gradient-filled numbered circle (via `resolveStepGradient`),
 *  - a soft `gradients.cardSheen*` overlay,
 *  - an accent-inked step title.
 *
 * Between the cards sit `gradients.spectrum` hairline connectors, which are
 * hidden below `sm` where the cards simply stack vertically.
 */
export function HowItWorks({ id, className }: HowItWorksProps) {
  const headingId = `${id ?? "how-it-works"}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={[
        layout.container,
        layout.section,
        layout.headerOffset,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className={typography.eyebrow}>How it works</p>

      <h2 id={headingId} className={`mt-2 ${typography.heading}`}>
        From verified request to paid bill
      </h2>

      <span
        aria-hidden="true"
        className={`mt-4 block h-1 w-24 rounded-full ${gradients.spectrum}`}
      />

      <p className={`mt-4 max-w-2xl ${typography.body}`}>
        Chief keeps the whole loop visible: a request is verified before it
        enters the deck, you swipe to pledge, and the provider is paid in Naira.
        No middlemen, no guessing where your money went.
      </p>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-3">
        {steps.map((step, index) => {
          const accent = stepAccents[index] ?? stepAccents[stepAccents.length - 1];

          return (
            <Fragment key={step.title}>
              {/* Spectrum hairline connector — desktop only. */}
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={`hidden shrink-0 self-center opacity-80 sm:block sm:h-px sm:w-6 ${gradients.spectrum}`}
                />
              ) : null}

              <article
                className={`${surfaces.card} relative flex min-w-0 flex-1 flex-col gap-3 overflow-hidden p-5 pt-6`}
              >
                {/* Per-step gradient top strip. */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 ${accent.strip}`}
                />

                {/* Soft radial sheen inside the card. */}
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 ${accent.sheen}`}
                />

                <div className="relative flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground shadow-sm ${resolveStepGradient(
                      index,
                    )}`}
                  >
                    {index + 1}
                  </span>

                  <h3
                    className={`min-w-0 text-base font-semibold tracking-tight ${accent.ink}`}
                  >
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </h3>
                </div>

                <p className={`relative ${typography.caption}`}>
                  {step.description}
                </p>
              </article>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}

export default HowItWorks;
