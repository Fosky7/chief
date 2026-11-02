import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ColorBackdrop } from "@/components/ColorBackdrop";
import { containment, cx } from "@/config/containment";

/**
 * Single QueryClient for the whole app. Created once at module scope so
 * navigations never tear down the cache.
 */
const queryClient = new QueryClient();

/**
 * Document-head additions for the root route.
 *
 * The Chief brand mark (`public/favicon.svg`) is registered here **and** as a
 * plain `<link>` in `index.html`, so the icon is present whether the shell is
 * hydrated (head manager active, SPA navigations included) or the document is
 * served cold / pre-hydration.
 *
 * These entries are purely ADDITIVE: no existing icon link is ever removed or
 * replaced, so a host that ships its own `favicon.ico` keeps working and the
 * SVG mark is simply the preferred (SVG-capable) icon.
 *
 * The href is always ROOT-ABSOLUTE (`/favicon.svg`), never a relative `./`
 * path, so nested routes such as `/discover` still resolve the icon.
 *
 * NOTE: these links are intentionally preserved across the design revert — the
 * calmer layout must never drop the icon wiring again.
 */
const rootHeadLinks = [
  { rel: "icon", type: "image/svg+xml", sizes: "any", href: "/favicon.svg" },
  { rel: "apple-touch-icon", href: "/favicon.svg" },
];

export const Route = createRootRoute({
  head: () => ({
    links: rootHeadLinks,
  }),
  component: RootLayout,
});

/**
 * Root layout: query provider + a single layered colour behind every route.
 *
 * This is the reverted (calmer) composition. Exactly two decorative layers
 * exist, both non-interactive and both token driven:
 *
 * 1. `bg-background` on the wrapper — the opaque base every page paints over.
 * 2. `<ColorBackdrop />` — a single fixed, `-z-10` stack of soft blurred brand
 *    blobs plus a subtle mesh, so *every* route inherits colour without any
 *    per-page duplication.
 *
 * The previous, heavier design pass stacked an extra fixed
 * `gradients.pageMesh` overlay (at `opacity-[0.18]`) on top of the backdrop
 * inside this component. That layer has been removed to restore the calmer
 * look; the subtle mesh now lives only inside `ColorBackdrop`, at a much lower
 * opacity. Do not re-add a second full-page wash here.
 *
 * Stacking: `isolate` on the wrapper creates a stacking context, which means
 * the backdrop's `-z-10` layer paints *above* the wrapper's own
 * `bg-background` and *below* the routed content. Without `isolate` the
 * wrapper background would cover the blobs entirely.
 *
 * Width containment: the wrapper carries `containment.routeRoot`
 * (`relative w-full max-w-full overflow-x-clip`) and re-states `max-w-full`
 * plus `overflow-x-clip`, so even a route rendered outside `AppShell` (the
 * catch-all `/$` and `not-found.tsx`) can never widen the document. `clip` is
 * listed after `hidden` at the CSS layer (`src/styles.css`), and `max-w-full`
 * remains the fallback on engines without `clip` support — containment never
 * relies on `clip` alone.
 *
 * Height: `min-h-dvh` keeps the shell full-height on mobile browsers whose
 * toolbars resize the visual viewport, so sticky chrome never jumps.
 *
 * The inner wrapper is a deliberately padding-free pass-through: horizontal
 * gutters belong to each page via `layout.container` (or `AppShell`), so routed
 * content is never double-padded by the root.
 *
 * `AppShell` deliberately stays transparent (no opaque background of its own)
 * so this colour actually shows through on every page.
 */
function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <div
        className={cx(
          containment.routeRoot,
          "isolate min-h-dvh max-w-full overflow-x-clip bg-background text-foreground",
        )}
      >
        {/* The ONLY decorative layer in the app. */}
        <ColorBackdrop />

        {/* Padding-free pass-through: pages and AppShell own their gutters. */}
        <div className="min-w-0 w-full max-w-full">
          <Outlet />
        </div>
      </div>
    </QueryClientProvider>
  );
}
