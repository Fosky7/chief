import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/LegalPage";

export const Route = createFileRoute("/disclaimer")({
  head: () =>
    legalHead("Disclaimer", "Important limits on what Chief verifies and guarantees for donors and bill posters."),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  return (
    <LegalPage
      testId="legal-disclaimer"
      title="Disclaimer"
      updated="November 23, 2026"
      intro="Please read this disclaimer so you understand what Chief's verification does and does not mean."
      sections={[
        { heading: "Verification limits", body: <p>Our team reviews the proof attached to every bill before it goes live, but we cannot guarantee every statement a bill poster makes is complete or accurate.</p> },
        { heading: "No financial advice", body: <p>Nothing on Chief is financial, legal or tax advice. Donations are not tax-deductible unless stated otherwise by the relevant authority.</p> },
        { heading: "Sample content", body: <p>Statistics and example bills on promotional pages may be illustrative and are not a promise of future results.</p> },
        { heading: "Third-party services", body: <p>Payments are handled by Paystack, and links to outside sites are provided for convenience. Chief is not responsible for third-party services.</p> },
      ]}
    />
  );
}
