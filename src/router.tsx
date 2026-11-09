import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// The file-based route plugin generates ./routeTree.gen.ts from src/routes/*.
// Every file under src/routes is registered automatically, including:
//   - src/routes/index.tsx  -> "/"
//   - src/routes/admin.tsx  -> "/admin" (admin review & approval queue)
// This file only needs to hand the generated tree to the router instance, so
// loading "/admin" directly resolves to the admin review page instead of a 404.
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
