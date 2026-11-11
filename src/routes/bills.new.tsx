import type { ComponentType } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as CreateBillRoute } from "./create-bill";

// /bills/new serves the same bill submission form as /create-bill so both
// addresses show the Title, Story, Category, Biller name, Amount (₦), Due date
// and Proof of bill fields with validation and the "Pending review" confirmation.
const CreateBillPage = CreateBillRoute.options.component as
  | ComponentType
  | undefined;

function NewBillPage() {
  if (CreateBillPage) return <CreateBillPage />;
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Submit a bill</h1>
      <p className="mt-2 text-muted-foreground">
        The bill form is loading. <Link to="/">Go home</Link>
      </p>
    </main>
  );
}

export const Route = createFileRoute("/bills/new")({
  head: () => ({
    meta: [
      { title: "Submit a bill — Proof of bill required" },
      {
        name: "description",
        content:
          "Submit a bill with its amount, due date and proof so supporters can help pay it.",
      },
    ],
  }),
  component: NewBillPage,
});
