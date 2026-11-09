import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { useAdminQueue } from "@/hooks/useAdminQueue";
import { formatNaira } from "@/lib/currency";
import type { AdminQueueBill } from "@/services/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin review · Kross" },
      { name: "description", content: "Review, approve and pay out submitted bills." },
    ],
  }),
  component: AdminReviewPage,
});

function statusLabel(status: string): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "paid":
      return "Paid out";
    default:
      return "Pending review";
  }
}

function isFunded(bill: AdminQueueBill): boolean {
  return bill.amount > 0 && bill.funded_amount >= bill.amount;
}

function AdminReviewPage() {
  const { bills, isAdmin, loading, error, pendingCount, approve, reject, markPaid } =
    useAdminQueue();
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<void>, message: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      await action();
      setNotice(message);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold">Bills awaiting review</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Approve legitimate bills, reject anything that looks wrong, and pay out funded bills to
          the biller.
        </p>

        {notice ? (
          <div
            role="status"
            className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
          >
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading review queue…</p>
        ) : !isAdmin ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Admins only</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Only administrators can approve or reject bills. Sign in with an admin account to
              continue.
            </p>
            <Link
              to={"/" as never}
              className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
            >
              Back to home
            </Link>
          </section>
        ) : (
          <section className="mt-8 space-y-4">
            <p className="text-sm text-muted-foreground">
              {pendingCount} bill{pendingCount === 1 ? "" : "s"} pending review
            </p>

            {bills.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
                No bills are waiting for review right now.
              </p>
            ) : null}

            {bills.map((bill) => {
              const funded = isFunded(bill);
              return (
                <article
                  key={bill.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{bill.title}</h2>
                      {bill.biller_name ? (
                        <p className="text-xs text-muted-foreground">Submitted by {bill.biller_name}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-slate-200">
                      {statusLabel(bill.status)}
                    </span>
                  </div>

                  {bill.description ? (
                    <p className="mt-3 text-sm text-muted-foreground">{bill.description}</p>
                  ) : null}

                  <dl className="mt-4 flex flex-wrap gap-6 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">Amount</dt>
                      <dd className="font-medium">{formatNaira(bill.amount)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-slate-500">Raised</dt>
                      <dd className="font-medium">{formatNaira(bill.funded_amount)}</dd>
                    </div>
                    {bill.category ? (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-slate-500">
                          Category
                        </dt>
                        <dd className="font-medium">{bill.category}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === bill.id}
                      onClick={() => run(bill.id, () => approve(bill.id), "Bill approved")}
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === bill.id}
                      onClick={() => run(bill.id, () => reject(bill.id), "Bill rejected")}
                      className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    {funded ? (
                      <button
                        type="button"
                        disabled={busyId === bill.id}
                        onClick={() => run(bill.id, () => markPaid(bill.id), "Paid out")}
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                      >
                        Mark paid to biller
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
