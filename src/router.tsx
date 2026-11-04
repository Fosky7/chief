import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// routeTree registers /, /discover, /dashboard, /sign-in and /signin (alias → /sign-in).
export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  notFoundMode: "root",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
