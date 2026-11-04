import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /auth is kept as an alias: the sign in / create-account page lives at
 * /sign-in (the address the navigation bar and earlier pages link to).
 */
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/sign-in", replace: true });
  },
});
