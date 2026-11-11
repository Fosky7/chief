import { createFileRoute, redirect } from "@tanstack/react-router";

// /bills/new is the canonical bill submission form (proof upload included).
// /create-bill is kept as a friendly alias that lands on the same form.
export const Route = createFileRoute("/create-bill")({
  head: () => ({ meta: [{ title: "Submit a bill · Chief" }] }),
  beforeLoad: () => {
    throw redirect({ to: "/bills/new" });
  },
});
