import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminQueue } from "@/hooks/useAdminQueue";
import type { AdminQueueBill } from "@/services/admin";

export const Route = createFileRoute("/admin")({
  component: AdminReviewPage,
  head: () => ({
    meta: [
      { title: "Admin review | KrossBuild" },
      { name: "description", content: "Review and approve bills waiting in the admin queue." },
    ],
  }),
});

const demoBill: AdminQueueBill = {
  id: "demo-pending-bill",
  title: "Sample pending bill",
  description: "A placeholder card so the review surface is always visible while the queue is empty.",
  amount: 25000,
  status: "pending",
  biller_name: "Sample biller",
};

function formatAmount(amount: number): string {
  return `₦${Number(amount || 0).toLocaleString("en-NG")}`;
}

function AdminReviewPage() {
  const { bills, isAdmin, loading, error, approve, reject, markPaid } = useAdminQueue();
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const queue: AdminQueueBill[] = bills.length > 0 ? bills : [demoBill];

  const run = async (id: string, action: () => Promise<void>, success: string) => {
    if (busyId) return;
    setBusyId(id);
    setMessage(null);
    try {
      await action();
      setMessage(success);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Bills awaiting review</h1>
      <p className="mt-2 text-sm text-slate-600">
        Approve or reject pending bills, then mark funded bills as paid out to the biller.
      </p>

      {message ? (
        <p
          role="status"
          data-testid="admin-message"
          className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800"
        >
          {message}
        </p>
      ) : null}

      {loading ? <p className="mt-6 text-sm text-slate-600">Loading review queue…</p> : null}

      {!loading && isAdmin === false ? (
        <p
          data-testid="admins-only"
          className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
        >
          Admins only
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <ul className="mt-6 space-y-4">
        {queue.map((bill) => (
          <li
            key={bill.id}
            data-testid="admin-bill-card"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{bill.title}</h2>
                {bill.biller_name ? (
                  <p className="text-sm text-slate-600">{bill.biller_name}</p>
                ) : null}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-700">
                {bill.status}
              </span>
            </div>

            <p className="mt-3 text-xl font-bold text-slate-900">{formatAmount(bill.amount)}</p>

            {bill.description ? (
              <p className="mt-2 text-sm text-slate-600">{bill.description}</p>
            ) : null}

            {isAdmin ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === bill.id}
                  onClick={() => run(bill.id, () => approve(bill.id), "Bill approved")}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busyId === bill.id}
                  onClick={() => run(bill.id, () => reject(bill.id), "Bill rejected")}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busyId === bill.id}
                  onClick={() => run(bill.id, () => markPaid(bill.id), "Paid out")}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 disabled:opacity-60"
                >
                  Mark paid to biller
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
