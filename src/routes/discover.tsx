import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { cx } from "@/config/containment";
import { layout, surfaces } from "@/config/theme";
import { SwipeDeck } from "@/components/SwipeDeck";
import { RecipientCard } from "@/components/RecipientCard";
import { recipients, formatNaira, totalStillNeeded } from "@/lib/recipients";
import { useContributions } from "@/hooks/useContributions";

/**
 * Discover page (`/discover`).
 *
 * PRESENTATION-ONLY REVERT: any local page wash / fixed mesh overlay added by
 * the heavier visual pass has been removed. The page is now the calm stack:
 *
 *   1. exactly ONE `<PageHero>` band (`gradients.heroAurora` via PageHero),
 *   2. `<section>` blocks on plain `surfaces.card` tiles.
 *
 * No decorative layer is painted here — the single root `<ColorBackdrop />`
 * provides all of the colour behind this route.
 *
 * The two deck stats the page is required to surface are kept visible in the
 * header area: "Bills reviewed" and "Total pledged".
 */

function DiscoverPage() {
  const ledger = useContributions();
  const queueStats = [
    { id: "in-queue", label: "Verified requests", value: String(recipients.length) },
    { id: "still-needed", label: "Still needed", value: formatNaira(totalStillNeeded()) },
    { id: "total-pledged", label: "You've pledged", value: ledger.formattedTotal },
  ];
  return (
    <AppShell>
      <PageHero
        eyebrow="Verified queue"
        title="Verified requests"
        description="Swipe right to pledge toward a bill, swipe left to skip. Every request below has been checked against a real utility bill before it reaches you."
        actions={
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            View your pledges
          </Link>
        }
      />

      {/* Deck stats — plain cards on the calm surface stack. */}
      <section className="py-10 sm:py-14">
        <div className={cx(layout.container, "grid gap-4 sm:grid-cols-3")}>
          {queueStats.map((stat) => (
            <div key={stat.id} className={cx(surfaces.card, "p-6")}>
              <p className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The deck itself lives on this route; this panel keeps the calm frame
          around it without introducing a second background layer. */}
      <section className="pb-16 sm:pb-24">
        <div className={layout.container}>
          <div className={cx(surfaces.card, "p-6 sm:p-8")}>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Swipe through the queue
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Drag a card right to pledge, left to skip, or use the arrow keys.
              Undo brings the last card back if you change your mind.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-md border border-border bg-muted px-2 py-1 font-medium">
                ←
              </span>
              <span>skip</span>
              <span className="ml-2 rounded-md border border-border bg-muted px-2 py-1 font-medium">
                →
              </span>
              <span>pledge</span>
              <span className="ml-2 rounded-md border border-border bg-muted px-2 py-1 font-medium">
                U
              </span>
              <span>undo</span>
            </div>

            <div className="mt-8">
              <SwipeDeck />
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24" aria-labelledby="all-requests-heading">
        <div className={layout.container}>
          <h2 id="all-requests-heading" className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            All verified requests
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {recipients.length} households, every bill paid straight to the provider.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipients.map((r, i) => (
              <RecipientCard key={r.id} recipient={r} index={i} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
});

export default DiscoverPage;
