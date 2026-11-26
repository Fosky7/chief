import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () =>
    legalHead("Privacy Policy", "How Chief collects, uses and protects your personal data under the Nigeria Data Protection Act."),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      testId="legal-privacy"
      title="Privacy Policy"
      updated="November 23, 2026"
      intro="Your privacy matters. This policy explains what personal data Chief collects, why, and the choices you have, in line with the Nigeria Data Protection Act 2023."
      sections={[
        { heading: "Data we collect", body: <p>Account details (such as your email), bill information and proof documents you upload, donation records, and basic technical data like device type needed to run the service.</p> },
        { heading: "How we use it", body: <p>To verify bills, process donations, show funding progress, keep the platform secure and contact you about your account. We do not sell your personal data.</p> },
        { heading: "Payments", body: <p>Card and bank details are handled by Paystack. Chief never stores your full card number.</p> },
        { heading: "Sharing", body: <p>We share data only with service providers who help us operate Chief (hosting, payments) or where the law requires it. Public bill pages show only what is needed for donors to decide.</p> },
        { heading: "Retention and security", body: <p>We keep data only as long as needed for the purposes above or legal obligations, and protect it with access controls and encryption in transit.</p> },
        { heading: "Your rights", body: <p>You may request access to, correction of, or deletion of your personal data, and may object to certain processing. Contact the Chief team through your account to make a request.</p> },
      ]}
    />
  );
}
