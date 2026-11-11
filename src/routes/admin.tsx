import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Banknote, Check, ShieldAlert, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ReviewStatus = "pending" | "approved" | "rejected" | "funded" | "paid";

interface ReviewBill {
  id: string;
  title: string;
  submitter: string;
  category: string;
  amount: number;
  fundedPercent: number;
  status: ReviewStatus;
  submittedAt: string;
  summary: string;
}

const SAMPLE_BILLS: ReviewBill[] = [
  {
    id: "bill-001",
    title: "Emergency appendectomy for Ada",
    submitter: "Chidi Okafor",
    category: "Medical",
    amount: 480000,
    fundedPercent: 34,
    status: "pending",
    submittedAt: "2024-06-02",
    summary:
      "Hospital invoice and discharge summary uploaded. Ada is scheduled for surgery on Friday and the deposit is due before admission.",
  },
  {
    id: "bill-002",
    title: "Final year tuition for Tunde",
    submitter: "Grace Adeyemi",
    category: "Education",
    amount: 250000,
    fundedPercent: 100,
    status: "funded",
    submittedAt: "2024-05-27",
    summary:
      "Fully funded by 42 neighbours. The school bursar verified the receipt — the balance is ready to be paid out.",
  },
  {
    id: "bill-003",
    title: "Shop restock after the flood",
    submitter: "Musa Ibrahim",
    category: "Small business",
    amount: 320000,
    fundedPercent: 62,
    status: "pending",
    submittedAt: "2024-06-04",
    summary:
      "Photos of the damaged stock and a supplier quote are attached. Waiting for a second admin to confirm the quotes.",
  },
];

const naira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  funded: "Funded · ready to pay",
  paid: "Paid out",
};

const STATUS_CLASS: Record<ReviewStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  approved: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-300",
  funded: "bg-sky-500/15 text-sky-300",
  paid: "bg-emerald-500/15 text-emerald-300",
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin review — Bill Chief" },
      {
        name: "description",
        content: "Review, approve, reject and pay out the community bills waiting in the Bill Chief queue.",
      },
    ],
  }),
  component: AdminReviewPage,
});

function AdminReviewPage() {
  const [bills, setBills] = useState<ReviewBill[]>(SAMPLE_BILLS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        const user = data.session?.user;
        const metaRole = (user?.user_metadata as { role?: string } | undefined)?.role;
        const appRole = (user?.app_metadata as { role?: string } | undefined)?.role;
        setIsAdmin(metaRole === "admin" || appRole === "admin");
      })
      .catch(() => {
        if (active) setIsAdmin(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateStatus = useCallback((id: string, status: ReviewStatus, message: string) => {
    setBills((prev) => prev.map((bill) => (bill.id === id ? { ...bill, status } : bill)));
    setFeedback(message);
  }, []);

  const pendingCount = bills.filter((bill) => bill.status === "pending").length;
  const fundedCount = bills.filter((bill) => bill.status === "funded").length;
  const totalValue = bills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link to="/" className="text-sm text-emerald-400 transition hover:text-emerald-300">
          ← Back to home
        </Link>

        <section className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">Admin</p>
            <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">Bills awaiting review</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Verify the proof, approve genuine requests and release funds once a bill is fully funded.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">Pending</dt>
              <dd className="text-lg font-semibold text-white">{pendingCount}</dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">Funded</dt>
              <dd className="text-lg font-semibold text-white">{fundedCount}</dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">Value</dt>
              <dd className="text-lg font-semibold text-white">{naira(totalValue)}</dd>
            </div>
          </dl>
        </section>

        {!isAdmin && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Admins only</p>
              <p className="text-sm text-amber-100/80">
                Only signed-in admins can moderate this queue. You are previewing the review actions with sample data.
              </p>
            </div>
          </div>
        )}

        {feedback && (
          <div
            role="status"
            data-testid="admin-feedback"
            className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-200"
          >
            {feedback}
          </div>
        )}

        <ul className="mt-6 space-y-4">
          {bills.map((bill) => (
            <li
              key={bill.id}
              data-testid={bill.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{bill.category}</span>
                    <span className={`rounded-full px-2 py-0.5 font-medium ${STATUS_CLASS[bill.status]}`}>
                      {STATUS_LABEL[bill.status]}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-white">{bill.title}</h2>
                  <p className="text-sm text-slate-400">
                    Submitted by {bill.submitter} · {bill.submittedAt}
                  </p>
                </div>
                <p className="text-xl font-bold text-emerald-400">{naira(bill.amount)}</p>
              </div>

              <p className="mt-3 text-sm text-slate-300">{bill.summary}</p>

              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${bill.fundedPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-400">{bill.fundedPercent}% funded</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {bill.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => updateStatus(bill.id, "approved", "Bill approved")}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(bill.id, "rejected", "Bill rejected")}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-500/50 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </button>
                  </>
                )}

                {bill.status === "funded" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(bill.id, "paid", "Paid out")}
                    className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                  >
                    <Banknote className="h-4 w-4" />
                    Mark paid to biller
                  </button>
                )}

                {(bill.status === "approved" || bill.status === "rejected" || bill.status === "paid") && (
                  <p className="text-sm font-medium text-slate-300">{STATUS_LABEL[bill.status]}</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {bills.length === 0 && (
          <p className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
            Nothing in the queue right now — every submitted bill has been reviewed.
          </p>
        )}
      </div>
    </main>
  );
}