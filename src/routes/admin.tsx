import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import {
  approveBill,
  billStatusLabel,
  canMarkPaid,
  fetchAdminQueue,
  formatNaira,
  isBillPendingReview,
  isCurrentUserAdmin,
  payoutBill,
  rejectBill,
  type AdminQueueBill,
} from "@/services/admin";

export const Route = createFileRoute("/admin")({
  component: AdminReviewPage,
  head: () => ({
    meta: [
      { title: "Admin review | KrossBuild" },
      {
        name: "description",
        content: "Review and approve bills waiting in the admin queue.",
      },
    ],
  }),
});

type Feedback = { message: string; tone: "success" | "error" };
type AdminAction = "approve" | "reject" | "payout";

/** Pending bills first, then funded, then everything else. */
const STATUS_PRIORITY: Record<string, number> = {
  pending: 0,
  pending_review: 0,
  in_review: 0,
  submitted: 0,
  awaiting_review: 0,
  funded: 1,
};

function normalizeStatus(status?: string | null): string {
  return (status ?? "").trim().toLowerCase().replace(/\s+/g, "_");
}

function sortQueue(bills: AdminQueueBill[]): AdminQueueBill[] {
  return [...bills].sort((a, b) => {
    return (STATUS_PRIORITY[normalizeStatus(a.status)] ?? 2) - (STATUS_PRIORITY[normalizeStatus(b.status)] ?? 2);
  });
}

function statusBadgeClasses(status?: string | null): string {
  const key = normalizeStatus(status);
  if (key === "paid" || key === "approved") return "bg-primary text-primary-foreground";
  if (key === "rejected") return "bg-destructive text-destructive-foreground";
  if (key === "funded") return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}

function AdminReviewPage() {
  const [bills, setBills] = useState<AdminQueueBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const queue = await fetchAdminQueue();
        if (!cancelled) setBills(sortQueue(queue));
      } catch (error) {
        if (!cancelled) {
          setFeedback({
            message:
              error instanceof Error ? error.message : "Could not load the review queue",
            tone: "error",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }

      // Role check is best effort: a signed-out visitor simply is not an admin.
      try {
        const admin = await isCurrentUserAdmin();
        if (!cancelled) setIsAdmin(admin);
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateStatus = useCallback((billId: string, status: string) => {
    setBills((current) =>
      current.map((bill) => (bill.id === billId ? { ...bill, status } : bill)),
    );
  }, []);

  const handleAction = useCallback(
    async (bill: AdminQueueBill, action: AdminAction) => {
      if (pendingActionId) return;
      setPendingActionId(bill.id);
      try {
        if (action === "approve") {
          await approveBill(bill.id);
          updateStatus(bill.id, "approved");
          setFeedback({ message: "Bill approved", tone: "success" });
        } else if (action === "reject") {
          await rejectBill(bill.id);
          updateStatus(bill.id, "rejected");
          setFeedback({ message: "Bill rejected", tone: "success" });
        } else {
          await payoutBill(bill.id);
          updateStatus(bill.id, "paid");
          setFeedback({ message: "Paid out", tone: "success" });
        }
      } catch (error) {
        setFeedback({
          message:
            error instanceof Error ? error.message : "That action could not be completed",
          tone: "error",
        });
      } finally {
        setPendingActionId(null);
      }
    },
    [pendingActionId, updateStatus],
  );

  const summary = useMemo(() => {
    const pending = bills.filter(isBillPendingReview).length;
    const funded = bills.filter(canMarkPaid).length;
    const total = bills.reduce((sum, bill) => sum + (Number(bill.amount) || 0), 0);
    return { pending, funded, total };
  }, [bills]);

  return (
    <>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <header className="mb-6">
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
        </header>

        {!isAdmin ? (
          <div
            data-testid="admin-notice"
            role="status"
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
          <div className="rounded-lg border border-border bg-card p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Awaiting review
            </dt>
            <dd
              className="mt-1 text-xl font-semibold text-foreground"
              data-testid="summary-pending"
            >
              {summary.pending}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Funded, awaiting payout
            </dt>
            <dd
              className="mt-1 text-xl font-semibold text-foreground"
              data-testid="summary-funded"
            >
              {summary.funded}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Total requested
            </dt>
            <dd
              className="mt-1 text-xl font-semibold text-foreground"
              data-testid="summary-total"
            >
              {formatNaira(summary.total)}
            </dd>
          </div>
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
                            onClick={() => void handleAction(bill, "approve")}
                            disabled={busy}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleAction(bill, "reject")}
                            disabled={busy}
                            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </>
                      ) : null}

                      {payable ? (
                        <button
                          type="button"
                          onClick={() => void handleAction(bill, "payout")}
                          disabled={busy}
                          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
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
    </>
  );
}

export default AdminReviewPage;
