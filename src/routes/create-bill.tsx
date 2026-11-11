import { createFileRoute, redirect } from "@tanstack/react-router";

// /create-bill is an alias for the canonical bill submission page at /bills/new,
// which renders the full form including the "Proof of bill" field.
export const Route = createFileRoute("/create-bill")({
  head: () => ({
    meta: [{ title: "Submit a bill" }],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/bills/new" });
  },
});
