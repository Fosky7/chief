import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * Application router.
 *
 * The route tree is file-based: every file under src/routes/ is registered in
 * src/routeTree.gen.ts (including the Module 5 moderation workspace at
 * /admin). Creating the router here — rather than inline in main.tsx — keeps a
 * single, typed instance that the `Register` declaration below can expose to
 * every `<Link to="...">` in the app.
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

export default router;
