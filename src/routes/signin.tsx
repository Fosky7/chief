import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy alias: /signin redirects to the canonical /sign-in entry point so
 * there is only ever one sign-in implementation.
 */
export const Route = createFileRoute("/signin")({
  head: () => ({ meta: [{ title: "Sign in — Kross" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/sign-in", replace: true });
  },
  component: () => null,
});
