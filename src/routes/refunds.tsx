import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/LegalPage";

export const Route = createFileRoute("/refunds")({
  head: () =>
    legalHead("Refund Policy", "When Chief donations can be refunded and how to request one."),
  component: RefundsPage,
});

function RefundsPage() {
  return (
    <LegalPage
      testId="legal-refunds"
      title="Refund Policy"
      updated="November 23, 2026"
      intro="Donations on Chief are gifts toward verified bills, so they are generally final. Refunds are available in the limited situations below."
      sections={[
        { heading: "Eligible refunds", body: <p>Duplicate or accidental charges, payments taken in error by the payment processor, or donations to a bill later found to be fraudulent and removed by our team.</p> },
        { heading: "Not eligible", body: <p>Change of mind after a donation has been applied to a verified bill, or donations to bills that have already been paid out.</p> },
        { heading: "How to request", body: <p>Contact the Chief team through your account within 14 days of the payment, including the Paystack reference. We aim to respond within 5 working days.</p> },
        { heading: "How refunds are paid", body: <p>Approved refunds go back to the original payment method via Paystack. Bank timelines may add a few extra days.</p> },
      ]}
    />
  );
}
