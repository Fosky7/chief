import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * File-based routing: every file under src/routes/ is picked up by the
 * TanStack Router plugin and registered in the generated routeTree, so
 * /admin (src/routes/admin.tsx) is served directly on a hard reload.
 */
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultErrorComponent: ({ error }) => (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-400">{String(error?.message ?? error)}</p>
    </div>
  ),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
