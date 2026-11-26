import { createFileRoute } from "@tanstack/react-router";
import { BillSubmissionForm } from "@/components/BillSubmissionForm";
import { GlowBackdrop } from "@/components/ui/brand";

const BILLS_NEW_TITLE = "Post a new bill for review — Chief";
const BILLS_NEW_DESCRIPTION =
  "Share your rent, school fees or hospital bill with proof so Chief's team can verify it and open it to donors.";

export const Route = createFileRoute("/bills/new")({
  head: () => ({
    meta: [
      { title: BILLS_NEW_TITLE },
      { name: "description", content: BILLS_NEW_DESCRIPTION },
      { property: "og:title", content: BILLS_NEW_TITLE },
      { property: "og:description", content: BILLS_NEW_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewBillPage,
});

const reviewSteps = [
  {
    title: "Describe the bill",
    body: "Give it a clear title, the amount needed and a short, honest story donors can relate to.",
  },
  {
    title: "Add the biller and proof",
    body: "Name the school, hospital, landlord or utility and attach up to three proof files — the invoice, a receipt and anything else that helps us verify it.",
  },
  {
    title: "We review it",
    body: "Our team checks the details, usually within 1–2 working days. You'll see the status on your dashboard.",
  },
  {
    title: "Donors give directly",
    body: "Once approved, your bill opens to donors and funds are paid straight to the biller.",
  },
];

const tips = [
  "Use the exact amount on the invoice.",
  "Keep the story short and specific.",
  "Attach up to 3 files, 5 MB each — photo or PDF.",
  "Make sure every file is sharp and readable.",
];

function NewBillPage() {
  return (
    <main className="relative isolate min-h-[70vh] text-foreground">
      <GlowBackdrop className="opacity-40" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-10">
          {/* Form card: solid surface for strong contrast and comfortable reading sizes. */}
          <section
            aria-label="New bill form"
            className="animate-fade-up rounded-3xl border border-border bg-card p-5 text-base leading-relaxed text-card-foreground shadow-elegant sm:p-8 [&_input]:text-base [&_label]:text-foreground [&_select]:text-base [&_textarea]:text-base"
          >
            <BillSubmissionForm />
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section
              aria-labelledby="review-steps-heading"
              className="animate-fade-up rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-elegant"
              style={{ animationDelay: "100ms" }}
            >
              <h2 id="review-steps-heading" className="font-display text-xl font-semibold tracking-tight">
                How review works
              </h2>
              <ol className="mt-5 space-y-5">
                {reviewSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span
                      aria-hidden="true"
                      className="bg-brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section
              aria-labelledby="tips-heading"
              className="animate-fade-up rounded-3xl border border-primary/25 bg-primary/5 p-6"
              style={{ animationDelay: "180ms" }}
            >
              <h2 id="tips-heading" className="text-base font-semibold text-foreground">
                Tips for faster approval
              </h2>
              <ul className="mt-3 space-y-2">
                {tips.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm leading-relaxed text-foreground">
                    <span aria-hidden="true" className="font-bold text-primary">
                      ✓
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                Your personal details are only shared with our review team.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
