import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  approveBill,
  fetchReviewQueue,
  formatAmount,
  markPaidToBiller,
  rejectBill,
  resolveReviewer,
  type ReviewBill,
  type Reviewer,
  type ReviewStatus,
} from "@/services/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin review — Chief" },
      { name: "description", content: "Review, approve and pay out submitted bills." },
    ],
  }),
  component: Page,
});

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  funded: "Funded",
  paid: "Paid out",
};

function Page() {
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [sampleMode, setSampleMode] = useState(false);

  useEffect(() => {
    let active = true;
    resolveReviewer().then((r) => {
      if (active) setReviewer(r);
    });
    return () => {
      active = false;
    };
  }, []);

  const canReview = reviewer?.kind === "admin" || sampleMode;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground">Bills awaiting review</h1>
      <p className="mt-2 text-muted-foreground">Approve or reject submitted bills and pay out funded ones.</p>

      {reviewer === null ? (
        <p className="mt-8 text-muted-foreground">Checking access…</p>
      ) : canReview ? (
        <>
          {reviewer.kind !== "admin" && (
            <p className="mt-6 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
              Sample data — changes are not saved and reset when you reload.
            </p>
          )}
          <ReviewQueue />
        </>
      ) : (
        <section className="mt-8 rounded-lg border border-border bg-card p-6 text-card-foreground">
          <h2 className="text-xl font-semibold">Admins only</h2>
          <p className="mt-2 text-muted-foreground">
            The review queue is restricted to admin accounts. You can explore it with sample data instead.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSampleMode(true)}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
            >
              Explore sample queue
            </button>
            <Link to="/" className="rounded-md border border-border px-4 py-2 text-foreground hover:bg-muted">
              Back to home
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

function ReviewQueue() {
  const [bills, setBills] = useState<ReviewBill[] | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchReviewQueue()
      .then(setBills)
      .catch(() => setMessage({ tone: "error", text: "Could not load the review queue." }));
  }, []);

  const run = useCallback(
    async (id: string, action: (id: string) => Promise<ReviewBill>, success: string) => {
      setBusyId(id);
      try {
        const updated = await action(id);
        setBills((prev) => (prev ?? []).map((b) => (b.id === id ? updated : b)));
        setMessage({ tone: "ok", text: success });
      } catch (e) {
        setMessage({ tone: "error", text: e instanceof Error ? e.message : "Action failed." });
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  if (!bills) return <p className="mt-8 text-muted-foreground">Loading queue…</p>;

  return (
    <div className="mt-6 space-y-4">
      {message && (
        <p
          role="status"
          className={
            message.tone === "ok"
              ? "rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground"
              : "rounded-md border border-destructive px-3 py-2 text-sm text-destructive"
          }
        >
          {message.text}
        </p>
      )}
      {bills.length === 0 && <p className="text-muted-foreground">No bills in the queue.</p>}
      {bills.map((bill) => (
        <article
          key={bill.id}
          aria-label={`Bill from ${bill.biller}`}
          className="rounded-lg border border-border bg-card p-5 text-card-foreground"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{bill.biller}</h3>
              <p className="text-sm text-muted-foreground">
                {formatAmount(bill.amountCents)} · due {bill.dueDate} · from {bill.submittedBy}
              </p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
              {STATUS_LABEL[bill.status]}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {bill.status === "pending" && (
              <>
                <button
                  type="button"
                  disabled={busyId === bill.id}
                  onClick={() => run(bill.id, approveBill, "Bill approved")}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === bill.id}
                  onClick={() => run(bill.id, rejectBill, "Bill rejected")}
                  className="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:opacity-90 disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}
            {bill.status === "funded" && (
              <button
                type="button"
                disabled={busyId === bill.id}
                onClick={() => run(bill.id, markPaidToBiller, `Paid out to ${bill.biller}`)}
                className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                Mark paid to biller
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
