import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// The file-based route plugin generates ./routeTree.gen.ts from src/routes/*.
// src/routes/admin.tsx is therefore registered at "/admin" automatically;
// this file only needs to hand the generated tree to the router instance.
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
