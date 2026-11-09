import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Application router.
 *
 * Routes are file-based under `src/routes/`, so `/admin` is registered by
 * `src/routes/admin.tsx` and picked up here through the generated route tree.
 * This file only wires the tree into a concrete router instance.
 */
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
