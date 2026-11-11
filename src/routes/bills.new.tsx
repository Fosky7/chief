import { createFileRoute } from "@tanstack/react-router";
import { Route as CreateBillRoute } from "./create-bill";

// /bills/new serves the same bill submission form as /create-bill.
function BillsNewPage() {
  const Form = CreateBillRoute.options.component as React.ComponentType | undefined;
  if (!Form) return null;
  return <Form />;
}

export const Route = createFileRoute("/bills/new")({
  head: () => ({
    meta: [
      { title: "Submit a bill — Chief" },
      { name: "description", content: "Submit a bill with proof for community support." },
    ],
  }),
  component: BillsNewPage,
});
