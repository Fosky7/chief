import { createFileRoute } from "@tanstack/react-router";
import { BillSubmissionForm } from "@/components/BillSubmissionForm";

export const Route = createFileRoute("/bills/new")({
  head: () => ({ meta: [{ title: "Submit a bill | Chief" }] }),
  component: NewBillPage,
});

function NewBillPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Submit a bill</h1>
      <BillSubmissionForm />
    </main>
  );
}
