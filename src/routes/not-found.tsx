import { createFileRoute } from "@tanstack/react-router";
import { GradientButton } from "@/components/ui/brand";

export type NotFoundViewProps = {
  /** Main heading. Defaults to the wording used across the app. */
  title?: string;
  /** Supporting copy under the heading. */
  description?: string;
  /**
   * Label for the primary action back to the home page.
   *
   * The footer already offers a "Back to home" link on every page, so the
   * in-page action uses a distinct label to keep accessibility lookups
   * unambiguous (one "Back to home" per page).
   */
  homeLabel?: string;
};

/**
 * Branded page-not-found view.
 *
 * It intentionally does NOT render <Layout> itself:
 *  - file-based routes are rendered inside the root layout's <Outlet />, and
 *  - the root route's `notFoundComponent` re-wraps it in <Layout>.
 * Keeping the view layout-free lets both entry points reuse the same markup.
 *
 * Responsive notes: the numeral, heading and body type scale up from phone to
 * desktop, the supporting copy is width-capped so it never stretches into an
 * unreadable line, and the primary action is full-width on small screens.
 */
export function NotFoundView({
  title = "Page not found",
  description = "The page you're looking for doesn't exist.",
  homeLabel = "Go home",
}: NotFoundViewProps) {
  return (
    <section
      data-testid="not-found"
      aria-labelledby="not-found-title"
      className="animate-fade-up mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24"
    >
      {/* Decorative numeral: hidden from assistive tech so the h1 carries meaning. */}
      <p
        aria-hidden="true"
        className="text-brand-gradient font-display text-6xl font-bold leading-none tracking-tight sm:text-8xl"
      >
        404
      </p>
      <h1
        id="not-found-title"
        className="mt-6 text-balance text-2xl font-semibold leading-tight sm:text-3xl md:text-4xl"
      >
        {title}
      </h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground sm:max-w-md sm:text-base">
        {description}
      </p>
      <GradientButton to="/" size="lg" className="mt-8 w-full sm:w-auto">
        {homeLabel}
      </GradientButton>
    </section>
  );
}

/**
 * The view is also reachable directly at /not-found so the route is a real,
 * typed member of the router tree (the file-based router expects every file in
 * src/routes to export a `Route`).
 */
export const Route = createFileRoute("/not-found")({
  head: () => ({
    meta: [
      { title: "Nothing here — Chief 404" },
      {
        name: "description",
        content:
          "Nothing lives at this Chief address. Use the navigation above to open Discover, your dashboard or the sign-in page.",
      },
      { property: "og:title", content: "Nothing here — Chief 404" },
      {
        property: "og:description",
        content:
          "Nothing lives at this Chief address. Use the navigation above to open Discover, your dashboard or the sign-in page.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotFoundPage,
});

function NotFoundPage() {
  return <NotFoundView />;
}
