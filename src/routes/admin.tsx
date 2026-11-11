import { createFileRoute } from "@tanstack/react-router";
import { useAdminQueue } from "@/hooks/useAdminQueue";
import { formatNaira } from "@/lib/currency";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin review queue" }],
  }),
});

function statusLabel(status: unknown): string {
  return String(status ?? "pending").replace(/_/g, " ");
}

function AdminPage() {
  const {
    queue,
    loading,
    error,
    isAdmin,
    feedback,
    busyId,
    summary,
    approve,
    reject,
    payout,
    refresh,
  } = useAdminQueue();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10" data-testid="admin-page">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Module 5
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Admin review queue</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Review submitted bills, approve them for publishing, reject invalid
            submissions, and release payouts for approved bills.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md border px-3 py-2 text-sm font-medium transition hover:bg-muted"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading review queue…</p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {!loading && !isAdmin ? (
        <section
          data-testid="admin-non-admin"
          className="rounded-lg border bg-card p-6"
        >
          <h2 className="text-lg font-semibold">Admin access required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an admin or reviewer account to review and approve
            bills.
          </p>
        </section>
      ) : null}

      {!loading && isAdmin ? (
        <section data-testid="admin-queue" className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <SummaryCard label="Pending" value={summary.pending} />
            <SummaryCard label="Approved" value={summary.approved} />
            <SummaryCard label="Rejected" value={summary.rejected} />
            <SummaryCard label="Paid" value={summary.paid} />
          </div>

          {feedback ? (
            <p
              role="status"
              data-testid="admin-feedback"
              className={
                feedback.ok
                  ? "rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700"
                  : "rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              }
            >
              {feedback.message}
            </p>
          ) : null}

          {queue.length === 0 ? (
            <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              No bills are waiting in the review queue.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Bill</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((bill) => {
                    const status = String(bill.status ?? "pending").toLowerCase();
                    const canReview =
                      status === "pending" ||
                      status === "pending_review" ||
                      status === "submitted";
                    const canPayout = status === "approved";
                    const busy = busyId === bill.id;

                    return (
                      <tr key={bill.id} className="border-b last:border-b-0">
                        <td className="px-4 py-3">
                          <p className="font-medium">{bill.title}</p>
                          {bill.description ? (
                            <p className="mt-1 line-clamp-2 max-w-md text-xs text-muted-foreground">
                              {bill.description}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          {formatNaira(Number(bill.amount ?? 0))}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full border px-2 py-1 text-xs capitalize">
                            {statusLabel(bill.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {canReview ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void approve(bill.id)}
                                  className="rounded-md border border-emerald-600/30 bg-emerald-600/10 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void reject(bill.id)}
                                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}
                            {canPayout ? (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void payout(bill.id)}
                                className="rounded-md border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                              >
                                Release payout
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
