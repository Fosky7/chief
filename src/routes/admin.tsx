import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";
import { useAdminQueue } from "@/hooks/useAdminQueue";
import {
  QUEUE_ERROR_MESSAGE,
  isCurrentUserAdmin,
  summariseQueue,
} from "@/services/admin";
import type { AdminQueueBill } from "@/services/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin review queue · Chief" },
      {
        name: "description",
        content:
          "Review pending hospital bill submissions, approve them for donation or mark funded bills as paid to the biller.",
      },
    ],
  }),
  component: AdminReviewPage,
});

function formatAmount(value: number): string {
  return `₦${Math.round(value).toLocaleString("en-NG")}`;
}

function statusLabel(status: AdminQueueBill["status"]): string {
  switch (status) {
    case "approved":
      return "Approved for donations";
    case "rejected":
      return "Rejected";
    case "paid":
      return "Paid out";
    case "funded":
      return "Fully funded";
    default:
      return "Awaiting review";
  }
}

function AdminReviewPage() {
  const { bills, loading, error, feedback, busyId, approve, reject, payout, reload } =
    useAdminQueue();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    isCurrentUserAdmin()
      .then((value) => {
        if (!active) return;
        setIsAdmin(value);
        setCheckingRole(false);
      })
      .catch(() => {
        if (!active) return;
        setIsAdmin(false);
        setCheckingRole(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const summary = summariseQueue(bills);
  const pendingBills = bills.filter((bill) => bill.status === "pending");
  const fundedBills = bills.filter((bill) => bill.status === "funded");
  const settledBills = bills.filter(
    (bill) => bill.status === "approved" || bill.status === "rejected" || bill.status === "paid",
  );

  return (
    <main className="min-h-dvh bg-slate-950 pb-24 text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-4 pt-10 sm:px-6">
        <section className="mb-8">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            <ShieldAlert className="h-4 w-4" />
            Admin
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Bills awaiting review
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Verify submitted hospital bills, approve the ones that should go live for donations,
            and settle funded bills with the hospital.
          </p>
        </section>

        {!checkingRole && !isAdmin && (
          <div
            data-testid="admin-notice"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100"
          >
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="text-sm font-semibold text-amber-100">Admins only</p>
              <p className="mt-1 text-sm text-amber-200/80">
                Approving and paying out bills requires an admin account. You are previewing the
                demo queue below.
              </p>
            </div>
          </div>
        )}

        <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Awaiting review</p>
            <p className="mt-1 text-2xl font-semibold text-white">{summary.awaitingReview}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Fully funded</p>
            <p className="mt-1 text-2xl font-semibold text-white">{summary.funded}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Settled</p>
            <p className="mt-1 text-2xl font-semibold text-white">{summary.settled}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending value</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {formatAmount(summary.pendingValue)}
            </p>
          </div>
        </section>

        {feedback && (
          <div
            role="status"
            aria-live="polite"
            data-testid="admin-feedback"
            className={`mb-6 flex items-start gap-3 rounded-2xl border p-4 ${
              feedback.ok
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                : "border-rose-400/30 bg-rose-400/10 text-rose-100"
            }`}
          >
            {feedback.ok ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading the review queue…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-6">
            <p className="text-sm text-rose-100">{error || QUEUE_ERROR_MESSAGE}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-rose-300/40 px-4 py-2 text-sm font-medium text-rose-50 hover:bg-rose-400/10"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-4 w-4 text-amber-300" /> Pending verification
              </h2>
              {pendingBills.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
                  Nothing is waiting for review right now.
                </p>
              ) : (
                <ul className="space-y-4">
                  {pendingBills.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      busy={busyId === bill.id}
                      onApprove={() => void approve(bill)}
                      onReject={() => void reject(bill)}
                    />
                  ))}
                </ul>
              )}
            </section>

            {fundedBills.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Funded & ready to settle
                </h2>
                <ul className="space-y-4">
                  {fundedBills.map((bill) => (
                    <BillCard
                      key={bill.id}
                      bill={bill}
                      busy={busyId === bill.id}
                      onPayout={() => void payout(bill)}
                    />
                  ))}
                </ul>
              </section>
            )}

            {settledBills.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Recently handled
                </h2>
                <ul className="space-y-4">
                  {settledBills.map((bill) => (
                    <BillCard key={bill.id} bill={bill} busy={busyId === bill.id} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

type BillCardProps = {
  bill: AdminQueueBill;
  busy: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onPayout?: () => void;
};

function BillCard({ bill, busy, onApprove, onReject, onPayout }: BillCardProps) {
  const fundedPercent = bill.amount > 0 ? Math.min(100, (bill.fundedAmount / bill.amount) * 100) : 0;

  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white sm:text-lg">{bill.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {bill.patientName} · {bill.hospital}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-white">{formatAmount(bill.amount)}</p>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {statusLabel(bill.status)}
          </p>
        </div>
      </div>

      {bill.fundedAmount > 0 && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${fundedPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatAmount(bill.fundedAmount)} of {formatAmount(bill.amount)} funded
          </p>
        </div>
      )}

      {(onApprove || onReject || onPayout) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onApprove && (
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Approve
            </button>
          )}
          {onReject && (
            <button
              type="button"
              onClick={onReject}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Reject
            </button>
          )}
          {onPayout && (
            <button
              type="button"
              onClick={onPayout}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Mark paid to biller
            </button>
          )}
        </div>
      )}
    </li>
  );
}
