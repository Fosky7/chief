import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, legalHead } from "@/components/LegalPage";

export const Route = createFileRoute("/cookies")({
  head: () =>
    legalHead("Cookie Policy", "Which cookies and local storage Chief uses, and how you can control them."),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalPage
      testId="legal-cookies"
      title="Cookie Policy"
      updated="November 23, 2026"
      intro="Chief uses a small number of cookies and browser storage items to keep you signed in and the site working smoothly."
      sections={[
        { heading: "Essential storage", body: <p>We store your sign-in session in your browser so you stay logged in. Without it, accounts and donations cannot work.</p> },
        { heading: "Payment cookies", body: <p>Paystack may set its own cookies during checkout to process payments securely and prevent fraud.</p> },
        { heading: "No advertising trackers", body: <p>Chief does not use advertising or cross-site tracking cookies.</p> },
        { heading: "Managing cookies", body: <p>You can clear or block cookies in your browser settings. Blocking essential storage will sign you out and may stop parts of Chief from working.</p> },
      ]}
    />
  );
}
