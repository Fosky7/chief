import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { RequestPreviewCard } from "@/components/home/RequestPreviewCard";
import { recipients, formatNaira, totalStillNeeded } from "@/lib/recipients";
import { cx } from "@/config/containment";
import {
  interactive,
  landingSteps,
  layout,
  surfaces,
  typography,
} from "@/config/theme";

/**
 * Landing page (`/`).
 *
 * Calm composition — unchanged design language:
 *
 *   1. exactly one `<PageHero>` band (`gradients.heroAurora`, owned by
 *      `PageHero`),
 *   2. `<section>` blocks on plain `surfaces.card` tiles,
 *   3. no page-level fixed overlay of any kind — all decorative colour comes
 *      from the single root `<ColorBackdrop />`.
 *
 * Interaction contracts (verbatim):
 *  - the hero headline is exactly "Swipe right to pay a bill";
 *  - "Start swiping" reveals the section headed "Verified requests";
 *  - "How it works" renders the three numbered steps from `landingSteps`.
 */

/**
 * `landingSteps` is the canonical source of the "How it works" copy. It is
 * consumed defensively so this file never assumes one exact key name for the
 * step body (the export shape is free to evolve without breaking the page).
 */
type StepLike = {
  title?: ReactNode;
  label?: ReactNode;
  description?: ReactNode;
  body?: ReactNode;
};

const steps = landingSteps as unknown as readonly StepLike[];
const headerOffset = (layout as { headerOffset?: string }).headerOffset;

const primaryButton =
  "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90";
const secondaryButton =
  "inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted";

function LandingPage() {
  const [showRequests, setShowRequests] = useState(false);
  const requestsRef = useRef<HTMLElement | null>(null);

  function handleStartSwiping() {
    setShowRequests(true);

    // The "Verified requests" section only mounts once revealed, so the scroll
    // is deferred one frame to make sure the target node exists.
    window.requestAnimationFrame(() => {
      requestsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <AppShell>
      <PageHero
        eyebrow="Give directly, give with confidence"
        title="Swipe right to pay a bill"
        description="Chief connects generous people with verified recipients, so every pledge reaches a real household quickly and transparently. Review the queue, then pledge in a single swipe."
        actions={
          <>
            <button
              type="button"
              onClick={handleStartSwiping}
              className={cx(primaryButton, interactive.focusRing)}
            >
              Start swiping
            </button>

            <Link
              to="/discover"
              className={cx(secondaryButton, interactive.focusRing)}
            >
              Browse verified requests
            </Link>
          </>
        }
      />

      {/* How it works — plain cards, no sheen or mesh behind the grid. */}
      <section
        id="how-it-works"
        aria-labelledby="how-it-works-heading"
        className={cx(
          "scroll-mt-24 py-14 sm:scroll-mt-28 sm:py-20",
          headerOffset,
        )}
      >
        <div className={layout.container}>
          <h2
            id="how-it-works-heading"
            className={cx("max-w-2xl", typography.display)}
          >
            How it works
          </h2>

          <p className={cx("mt-4 max-w-2xl", typography.body)}>
            Three steps, no paperwork you have to chase. Verification happens
            before a request ever reaches your screen.
          </p>

          <ol className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={index}
                className={cx(surfaces.card, "flex flex-col gap-3 p-6")}
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {step.title ?? step.label ?? `Step ${index + 1}`}
                </h3>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description ?? step.body ?? ""}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Live preview of the queue + headline numbers. */}
      <section aria-labelledby="queue-preview-heading" className="pb-14 sm:pb-20">
        <div className={layout.container}>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Verified requests", value: String(recipients.length) },
              { label: "Still needed", value: formatNaira(totalStillNeeded()) },
              { label: "Paid to", value: "Billers only" },
            ].map((stat) => (
              <div key={stat.label} className={cx(surfaces.card, "p-5")}>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          <h2 id="queue-preview-heading" className={cx("mt-12", typography.display)}>
            In the queue today
          </h2>
          <ul className="mt-6 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {recipients.slice(0, 3).map((r, i) => (
              <RequestPreviewCard key={r.id} recipient={r} index={i} />
            ))}
          </ul>
        </div>
      </section>

      {/* Revealed by "Start swiping". One card on the plain surface stack. */}
      {showRequests ? (
        <section
          id="verified-requests"
          ref={requestsRef}
          aria-labelledby="verified-requests-heading"
          className={cx(
            "scroll-mt-24 pb-16 sm:scroll-mt-28 sm:pb-24",
            headerOffset,
          )}
        >
          <div className={layout.container}>
            <div className={cx(surfaces.card, "p-6 sm:p-8")}>
              <h2
                id="verified-requests-heading"
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                Verified requests
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Every request in the queue has been checked against a utility
                bill before it goes live. Swipe right to pledge toward a bill,
                swipe left to skip, and undo any decision from the deck.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/discover"
                  className={cx(
                    "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
                    interactive.focusRing,
                  )}
                >
                  Open the deck
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Closing CTA — plain card, same surface stack. */}
      <section className="pb-16 sm:pb-24">
        <div className={layout.container}>
          <div
            className={cx(
              surfaces.card,
              "flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8",
            )}
          >
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Ready when you are
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Pledge what you can, skip what you cannot, and follow every
                contribution from your dashboard.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/discover"
                className={cx(
                  "inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90",
                  interactive.focusRing,
                )}
              >
                Browse verified requests
              </Link>

              <Link
                to="/dashboard"
                className={cx(
                  "inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted",
                  interactive.focusRing,
                )}
              >
                Your pledges
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export const Route = createFileRoute("/")({
  component: LandingPage,
});

export default LandingPage;
