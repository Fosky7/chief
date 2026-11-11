import type { ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Route as CreateBillRoute } from "./create-bill";

// /bills/new serves the same bill submission form as /create-bill so both
// addresses use one implementation: Title, Story, Category, Biller name,
// Amount (₦) with naira formatting, Due date, Proof of bill, validation and
// the "Pending review" confirmation.
const BillForm = CreateBillRoute.options.component as ComponentType | undefined;

function BillsNewPage() {
  if (!BillForm) return null;
  return <BillForm />;
}

export const Route = createFileRoute("/bills/new")({
  head: () => ({
    meta: [
      { title: "Submit a bill · Chief" },
      {
        name: "description",
        content: "Submit a bill with proof so supporters can help you pay it.",
      },
    ],
  }),
  component: BillsNewPage,
});
