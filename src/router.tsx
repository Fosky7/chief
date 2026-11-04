import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// routeTree registers /, /discover, /dashboard, /sign-in and /signin.
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
