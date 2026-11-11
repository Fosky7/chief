import { createFileRoute } from "@tanstack/react-router";
import { BillSubmissionForm } from "@/components/BillSubmissionForm";

export const Route = createFileRoute("/create-bill")({
  head: () => ({ meta: [{ title: "Create a bill | Chief" }] }),
  component: CreateBillPage,
});

function CreateBillPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Create a bill</h1>
      <BillSubmissionForm />
    </main>
  );
}
