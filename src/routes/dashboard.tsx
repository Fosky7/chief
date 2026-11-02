import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { PageSection } from "@/components/PageSection";
import { buttons, surfaces, typography } from "@/config/theme";
import { useContributions } from "@/hooks/useContributions";
import { recipients } from "@/lib/recipients";

/** Example record shown until the donor's first real pledge. */
const SAMPLE_PLEDGES: ContributionLike[] = [
  { id: "s1", recipientName: recipients[0]?.name, amount: 5000, status: "Paid to biller", createdAt: "28 Oct 2026" },
  { id: "s2", recipientName: recipients[1]?.name, amount: 2500, status: "Paid to biller", createdAt: "21 Oct 2026" },
  { id: "s3", recipientName: recipients[2]?.name, amount: 1000, status: "Processing", createdAt: "14 Oct 2026" },
  { id: "s4", recipientName: recipients[3]?.name, amount: 2500, status: "Paid to biller", createdAt: "3 Oct 2026" },
];

/**
 * Dashboard page ("/dashboard") — reverted calm composition.
 *
 * One `PageHero` aurora band, plain `surfaces.card` summary tiles and the
 * ledger list. The only decorative layer is the root `ColorBackdrop`; this
 * route adds no mesh, sheen or fixed overlay of its own.
 *
 * `useContributions()` is still the single source of giving data — the cast
 * below only keeps the presentation edit from redefining the ledger model.
 */

type ContributionLike = {
  id?: string | number;
  recipientName?: string;
  name?: string;
  amount?: number;
  status?: string;
  createdAt?: string;
};


function formatNaira(amount: number | undefined): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "₦0";
  return `₦${amount.toLocaleString("en-NG")}`;
}

function DashboardPage() {
  const ledger = useContributions();
  const isSample = ledger.contributions.length === 0;
  const contributions: ContributionLike[] = isSample
    ? SAMPLE_PLEDGES
    : ledger.contributions.map((c) => ({
        id: c.id,
        recipientName: c.recipientName,
        amount: c.amount,
        status: "Paid to biller",
        createdAt: c.formattedDate,
      }));
  const totalPledged = contributions.reduce(
    (sum, entry) => sum + (typeof entry.amount === "number" ? entry.amount : 0),
    0,
  );
  const count = contributions.length;
  const households = new Set(contributions.map((c) => c.recipientName)).size;

  return (
    <AppShell>
      <PageHero
        eyebrow="Your giving"
        title="Your pledges"
        description="Every pledge you make through Chief is recorded here. Pledges are paid to the verified provider — never to another donor."
        actions={
          <Link to="/discover" className={buttons.primary}>
            Back to discover
          </Link>
        }
      />

      <PageSection
        id="pledge-ledger"
        heading="Pledge ledger"
        description="A running record of the requests you have backed on this device."
      >
        {isSample ? (
          <p className="mb-4 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            Example giving record — your own pledges replace it after your first swipe.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className={`${surfaces.card} p-5`}>
            <p className={typography.caption}>Total pledged</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">
              {formatNaira(totalPledged)}
            </p>
          </div>
          <div className={`${surfaces.card} p-5`}>
            <p className={typography.caption}>Pledges made</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">
              {count}
            </p>
          </div>
          <div className={`${surfaces.card} p-5`}>
            <p className={typography.caption}>Households helped</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">
              {households}
            </p>
          </div>
        </div>

        {contributions.length > 0 ? (
          <ul className="mt-6 space-y-3">
            {contributions.map((entry, index) => (
              <li
                key={entry.id ?? `${entry.recipientName ?? entry.name ?? "pledge"}-${index}`}
                className={`${surfaces.card} flex flex-wrap items-center justify-between gap-4 p-4`}
              >
                <div className="min-w-0">
                  <p className={typography.subheading}>
                    {entry.recipientName ?? entry.name ?? "Verified request"}
                  </p>
                  {entry.createdAt ? (
                    <p className={`mt-1 ${typography.caption}`}>
                      {entry.createdAt}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-4">
                  {entry.status ? (
                    <span className={typography.caption}>{entry.status}</span>
                  ) : null}
                  <span className="text-lg font-semibold text-foreground">
                    {formatNaira(entry.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={`mt-6 ${surfaces.card} p-6`}>
            <h3 className={typography.subheading}>No pledges yet</h3>
            <p className={`mt-2 ${typography.body}`}>
              Swipe through verified requests on Discover and pledge to a bill
              to start your giving record.
            </p>
            <div className="mt-4">
              <Link to="/discover" className={buttons.primary}>
                Find a request
              </Link>
            </div>
          </div>
        )}
      </PageSection>
    </AppShell>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

export default DashboardPage;
