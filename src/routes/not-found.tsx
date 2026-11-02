import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { buttons, layout, surfaces, typography } from "@/config/theme";

/**
 * Not-found page.
 *
 * The background is the single `ColorBackdrop` inherited from `__root.tsx` — no
 * local wash or mesh is added here. The heading uses the shared `PageHero` so
 * the calm one-aurora-band composition is identical to every other page.
 */
export function NotFoundPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="404"
        title="Page not found"
        description="That link does not point at a page Chief knows about. Head back to Discover to find a verified request, or check your giving on the dashboard."
        actions={
          <Link to="/" className={buttons.primary}>
            Back to home
          </Link>
        }
      />

      <section className={`${layout.container} ${layout.section}`}>
        <div className={`mx-auto max-w-2xl ${surfaces.card} p-6`}>
          <h2 className={typography.subheading}>Where to next</h2>
          <p className={`mt-2 ${typography.body}`}>
            The page may have moved, or the address may have a typo. Chief only
            needs a valid route to get you back on track.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/discover" className={buttons.primary}>
              Go to Discover
            </Link>
            <Link to="/dashboard" className={buttons.secondary}>
              View your pledges
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export const Route = createFileRoute("/not-found")({
  component: NotFoundPage,
});

export default NotFoundPage;
