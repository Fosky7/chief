import { createFileRoute } from "@tanstack/react-router";
import { BillSubmissionForm } from "@/components/BillSubmissionForm";

// Legacy /create-bill URL: renders the same bill submission form as /bills/new.
export const Route = createFileRoute("/create-bill")({
  head: () => ({
    meta: [{ title: "Submit a bill" }],
  }),
  component: CreateBillPage,
});

function CreateBillPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <BillSubmissionForm />
    </main>
  );
}
