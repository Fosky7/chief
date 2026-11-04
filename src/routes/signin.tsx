import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias route: /signin redirects to the canonical /sign-in page.
export const Route = createFileRoute("/signin")({
  beforeLoad: () => {
    throw redirect({ to: "/sign-in", replace: true });
  },
});
