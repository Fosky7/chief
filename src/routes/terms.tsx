import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () =>
    legalHead("Terms of Service", "The rules for using Chief to give toward or post verified bills in Nigeria."),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      testId="legal-terms"
      title="Terms of Service"
      updated="November 23, 2026"
      intro="These terms govern your use of Chief. By browsing, donating or posting a bill you agree to them. If you do not agree, please do not use the service."
      sections={[
        { heading: "What Chief does", body: <p>Chief lets people share verified rent, school-fee, hospital and utility bills, and lets donors contribute toward them. Chief is not a bank, lender, charity trustee or insurer.</p> },
        { heading: "Accounts", body: <p>You must be at least 18 years old to create an account. Keep your sign-in details private; you are responsible for activity on your account.</p> },
        { heading: "Posting bills", body: <p>Every bill must be genuine, accurate and supported by proof. Our team reviews each bill before it goes live and may reject or remove any bill that is misleading, duplicated or fraudulent. Funds raised must be used only for the stated bill.</p> },
        { heading: "Donations", body: <p>Donations are voluntary gifts processed by Paystack. A donation does not give you ownership, interest or any right of repayment. See our Refund Policy for the limited cases where money may be returned.</p> },
        { heading: "Prohibited conduct", body: <p>Do not impersonate others, upload false documents, harass users, attempt to bypass verification or interfere with the platform's security.</p> },
        { heading: "Liability", body: <p>Chief is provided "as is". To the extent permitted by Nigerian law, Chief is not liable for indirect losses or for the actions of users who post bills or donate.</p> },
        { heading: "Changes and governing law", body: <p>We may update these terms and will show the new date above. These terms are governed by the laws of the Federal Republic of Nigeria.</p> },
      ]}
    />
  );
}
