import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// The route tree is generated from the files in src/routes/ (including
// src/routes/admin.tsx), so registering the /admin route happens here by
// mounting the generated tree on the router.
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
