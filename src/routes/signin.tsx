import { createFileRoute, redirect } from "@tanstack/react-router";

// /auth is the single canonical sign-in / sign-up page.
export const Route = createFileRoute("/signin")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
