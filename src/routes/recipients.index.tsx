import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { RecipientCard } from "@/components/RecipientCard";
import { cx } from "@/config/containment";
import { layout } from "@/config/theme";
import { formatNaira, recipients, totalStillNeeded } from "@/lib/recipients";

export const Route = createFileRoute("/recipients")({
  head: () => ({
    meta: [
      { title: "Verified recipients — Chief" },
      { name: "description", content: "Every verified household bill waiting for a pledge on Chief, with what's still needed in Naira." },
    ],
  }),
  component: RecipientsPage,
});

function RecipientsPage() {
  return (
    <AppShell>
      <PageHero
        eyebrow="Verified requests"
        title="Recipients"
        description={`${recipients.length} verified households still need ${formatNaira(totalStillNeeded())} in total. Open a story to see the full bill.`}
      />
      <section className={cx(layout.container, "pb-16")}>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipients.map((recipient, index) => (
            <li key={recipient.id}>
              <RecipientCard recipient={recipient} index={index} className="h-full" />
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
