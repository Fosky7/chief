import { createFileRoute } from "@tanstack/react-router";
import { BillSubmissionForm } from "@/components/BillSubmissionForm";
import { GlowBackdrop } from "@/components/ui/brand";
import { PROOF_ALLOWANCE_HINT } from "@/types";

// Legacy /create-bill URL: renders the same shared multi-file bill form as /bills/new.
export const Route = createFileRoute("/create-bill")({
  head: () => ({
    meta: [{ title: "Submit a bill" }],
  }),
  component: CreateBillPage,
});

function CreateBillPage() {
  return (
    <main className="relative isolate mx-auto max-w-2xl px-4 py-12 text-foreground">
      <GlowBackdrop className="opacity-40" />
      <BillSubmissionForm />
      <p className="mt-6 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        {PROOF_ALLOWANCE_HINT} Our review team checks every file before your bill goes live.
      </p>
    </main>
  );
}
