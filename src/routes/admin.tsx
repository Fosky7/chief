import { createFileRoute } from "@tanstack/react-router";
import { useAdminQueue } from "@/hooks/useAdminQueue";
import {
  billStatusLabel,
  canMarkPaid,
  formatNaira,
  isBillPendingReview,
  isSampleBill,
} from "@/services/admin";

export const Route = createFileRoute("/admin")({
  component: AdminReviewPage,
  head: () => ({
    meta: [
      { title: "Admin review | Chief" },
      {
        name: "description",
        content: "Review and approve bills waiting in the admin queue.",
      },
    ],
  }),
});

const PRIMARY_ACTION_CLASS =
  "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

const SECONDARY_ACTION_CLASS =
  "rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

/** Normalise a status for comparison (lowercase, underscores). */
function normalizeStatus(status?: string | null): string {
  return (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function statusBadgeClasses(status?: string | null): string {
  const key = normalizeStatus(status);
  if (key === "paid" || key === "approved") return "bg-primary text-primary-foreground";
  if (key === "rejected") return "bg-destructive text-destructive-foreground";
  if (key === "funded") return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}

function SummaryCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string | number;
  testId: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-foreground" data-testid={testId}>
        {value}
      </dd>
    </div>
  );
}

function AdminReviewPage() {
  const { bills, isLoading, isAdmin, feedback, pendingActionId, summary, runAction } =
    useAdminQueue();

  const hasSampleBills = bills.some(isSampleBill);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Bills awaiting review
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Verify submitted bills, approve or reject them, and pay out bills that the
          community has already funded.
        </p>
        {hasSampleBills ? (
          <p className="mt-2 text-xs text-muted-foreground" data-testid="admin-sample-note">
            Sample bills are included so the review actions can be tried out safely.
          </p>
        ) : null}
      </div>

      {/* The role gate waits for the role probe so admins never see it flash. */}
      {!isLoading && !isAdmin ? (
        <div
          data-testid="admin-notice"
          role="note"
          className="mb-6 rounded-lg border border-border bg-muted/60 p-4"
        >
          <p className="text-sm font-semibold text-foreground">Admins only</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Approval rights belong to admin accounts. You can still review the queue below;
            changes to live bills are limited to admins.
          </p>
        </div>
      ) : null}

      <dl className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Awaiting review"
          value={summary.pending}
          testId="summary-pending"
        />
        <SummaryCard
          label="Funded, awaiting payout"
          value={summary.funded}
          testId="summary-funded"
        />
        <SummaryCard
          label="Total requested"
          value={formatNaira(summary.total)}
          testId="summary-total"
        />
      </dl>

      {feedback ? (
        <div
          data-testid="admin-feedback"
          role="status"
          aria-live="polite"
          className={`mb-6 rounded-lg border p-3 text-sm font-medium ${
            feedback.tone === "success"
              ? "border-border bg-secondary text-secondary-foreground"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground" data-testid="queue-loading">
          Loading review queue…
        </p>
      ) : bills.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="queue-empty">
          Nothing to review right now.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {bills.map((bill) => {
            const pending = isBillPendingReview(bill);
            const payable = canMarkPaid(bill);
            const busy = pendingActionId === bill.id;

            return (
              <li key={bill.id}>
                <article
                  data-testid="approval-card"
                  data-bill-id={bill.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-card-foreground">
                        {bill.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {bill.biller_name ?? "Bill provider"}
                        {bill.category ? ` · ${bill.category}` : ""}
                      </p>
                    </div>
                    <span
                      data-testid="bill-status"
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                        bill.status,
                      )}`}
                    >
                      {billStatusLabel(bill.status)}
                    </span>
                  </div>

                  {bill.description ? (
                    <p className="mt-3 text-sm text-muted-foreground">{bill.description}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2">
                    <p
                      data-testid="bill-amount"
                      className="text-xl font-semibold text-foreground"
                    >
                      {formatNaira(bill.amount)}
                    </p>
                    {bill.due_date ? (
                      <p className="text-sm text-muted-foreground">
                        Due {new Date(bill.due_date).toLocaleDateString("en-NG")}
                      </p>
                    ) : null}
                    {Number(bill.funded_amount ?? 0) > 0 ? (
                      <p className="text-sm text-muted-foreground" data-testid="bill-funded">
                        Funded {formatNaira(bill.funded_amount)}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {pending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void runAction(bill, "approve")}
                          disabled={busy}
                          className={PRIMARY_ACTION_CLASS}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void runAction(bill, "reject")}
                          disabled={busy}
                          className={SECONDARY_ACTION_CLASS}
                        >
                          Reject
                        </button>
                      </>
                    ) : null}

                    {payable ? (
                      <button
                        type="button"
                        onClick={() => void runAction(bill, "payout")}
                        disabled={busy}
                        className={PRIMARY_ACTION_CLASS}
                      >
                        Mark paid to biller
                      </button>
                    ) : null}

                    {!pending && !payable ? (
                      <p className="text-sm text-muted-foreground">No further action needed.</p>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

export default AdminReviewPage;