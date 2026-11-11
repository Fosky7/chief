import { createFileRoute, redirect } from "@tanstack/react-router";

// /create-bill is a friendly alias for the bill submission form at /bills/new.
export const Route = createFileRoute("/create-bill")({
  head: () => ({
    meta: [{ title: "Post a bill — Chief" }],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/bills/new", replace: true });
  },
  component: CreateBillRedirect,
});

function CreateBillRedirect() {
  return (
    <div role="status" className="mx-auto max-w-md px-4 py-24 text-center text-muted-foreground">
      Opening the bill form…
    </div>
  );
}
