import { createFileRoute, redirect } from "@tanstack/react-router";

// /home is a friendly alias for the welcome page.
export const Route = createFileRoute("/home")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
