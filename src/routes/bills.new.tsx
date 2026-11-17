import { createFileRoute } from "@tanstack/react-router";
import { BillSubmissionForm } from "@/components/BillSubmissionForm";

export const Route = createFileRoute("/bills/new")({
  head: () => ({
    meta: [
      { title: "Submit a bill — get help paying it" },
      { name: "description", content: "Share your story and upload proof of your bill so donors can help." },
    ],
  }),
  component: NewBillPage,
});

function NewBillPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <BillSubmissionForm />
    </main>
  );
}
