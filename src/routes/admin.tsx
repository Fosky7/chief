import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, ShieldCheck } from "lucide-react";
import {
  approveBill,
  fetchReviewQueue,
  formatAmount,
  markPaidToBiller,
  rejectBill,
  resolveReviewer,
  type ReviewBill,
  type Reviewer,
} from "@/services/admin";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin review queue" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [bills, setBills] = useState<ReviewBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const r = await resolveReviewer();
      if (!active) return;
      setReviewer(r);
      if (r.isAdmin) {
        const q = await fetchReviewQueue();
        if (active) setBills(q);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function act(bill: ReviewBill, kind: "approve" | "reject" | "payout") {
    setBusy(bill.id);
    try {
      const fn = kind === "approve" ? approveBill : kind === "reject" ? rejectBill : markPaidToBiller;
      const updated = await fn(bill.id);
      setBills((prev) => prev.map((b) => (b.id === bill.id ? { ...b, ...(updated ?? {}), status: updated?.status ?? b.status } : b)));
      setMessages((m) => ({
        ...m,
        [bill.id]: kind === "approve" ? "Bill approved" : kind === "reject" ? "Bill rejected" : "Paid out",
      }));
    } catch (e) {
      setMessages((m) => ({ ...m, [bill.id]: `Action failed: ${(e as Error).message}` }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills awaiting review</h1>
          <p className="text-sm text-muted-foreground">
            Verify proof, approve genuine bills, and release funds straight to billers.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading review queue…</p>
      ) : !reviewer?.isAdmin ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-xl font-semibold">Admins only</h2>
          <p className="mt-2 text-sm">
            This review queue is restricted to platform administrators.{" "}
            {reviewer?.userId ? "Your account does not have admin access." : "Please sign in with an admin account."}
          </p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium underline">
            Back to home
          </Link>
        </div>
      ) : bills.length === 0 ? (
        <p className="text-muted-foreground">The queue is clear — no bills need review right now.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {bills.map((bill) => {
            const pct = bill.amount > 0 ? Math.min(100, Math.round((bill.raised / bill.amount) * 100)) : 0;
            const msg = messages[bill.id];
            return (
              <article
                key={bill.id}
                data-testid="review-bill-card"
                className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                {bill.proofUrl && (
                  <img src={bill.proofUrl} alt={`Proof for ${bill.title}`} className="h-36 w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      {bill.category}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{bill.status.replace("_", " ")}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{bill.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    For {bill.beneficiary} · pays {bill.biller}
                  </p>
                  <p className="text-sm">
                    <strong>{formatAmount(bill.raised)}</strong> of {formatAmount(bill.amount)} ({pct}%)
                  </p>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {bill.status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={busy === bill.id}
                          onClick={() => act(bill, "approve")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy === bill.id}
                          onClick={() => act(bill, "reject")}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </>
                    )}
                    {bill.status === "funded" && (
                      <button
                        type="button"
                        disabled={busy === bill.id}
                        onClick={() => act(bill, "payout")}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Mark paid to biller
                      </button>
                    )}
                  </div>
                  {msg && (
                    <p role="status" className="mt-2 text-sm font-medium text-emerald-700">
                      {msg}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
