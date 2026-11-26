import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, Settings } from "lucide-react";
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
    meta: [
      { title: "Admin review queue" },
      { name: "description", content: "Review, approve and pay out submitted bills." },
    ],
  }),
  component: AdminPage,
});

const MESSAGES: Record<string, string> = {
  approved: "Bill approved",
  rejected: "Bill rejected",
  paid: "Paid out",
};

function AdminPage() {
  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [bills, setBills] = useState<ReviewBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Bill whose rejection reason box is open (only one at a time). */
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [reasonErrors, setReasonErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const r = await resolveReviewer();
      const q = await fetchReviewQueue(r);
      if (!active) return;
      setReviewer(r);
      setBills(q);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function act(bill: ReviewBill, fn: (b: ReviewBill) => Promise<ReviewBill>) {
    setBusyId(bill.id);
    setErrors((e) => ({ ...e, [bill.id]: "" }));
    try {
      const updated = await fn(bill);
      setBills((list) => list.map((b) => (b.id === bill.id ? updated : b)));
    } catch (err) {
      setErrors((e) => ({ ...e, [bill.id]: err instanceof Error ? err.message : "Action failed" }));
    } finally {
      setBusyId(null);
    }
  }

  function openRejectBox(bill: ReviewBill) {
    setRejectingId(bill.id);
    setReasonErrors((e) => ({ ...e, [bill.id]: "" }));
  }

  /**
   * Confirms a rejection. The reason is mandatory: confirming with an empty box
   * shows an inline nudge and the bill stays pending, so nothing is ever
   * rejected without the poster knowing what to fix.
   */
  async function confirmReject(bill: ReviewBill) {
    const reason = (reasonDrafts[bill.id] ?? "").trim();
    if (!reason) {
      setReasonErrors((e) => ({
        ...e,
        [bill.id]: "Enter a reason so the poster knows what to fix.",
      }));
      return;
    }
    setReasonErrors((e) => ({ ...e, [bill.id]: "" }));
    setBusyId(bill.id);
    setErrors((e) => ({ ...e, [bill.id]: "" }));
    try {
      const updated = await rejectBill(bill, reason);
      setBills((list) => list.map((b) => (b.id === bill.id ? updated : b)));
      setRejectingId((id) => (id === bill.id ? null : id));
      setReasonDrafts((d) => ({ ...d, [bill.id]: "" }));
    } catch (err) {
      setErrors((e) => ({
        ...e,
        [bill.id]: err instanceof Error ? err.message : "Action failed",
      }));
    } finally {
      setBusyId(null);
    }
  }

  const isAdmin = !!reviewer?.isAdmin;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-7 w-7 text-emerald-500" />
        <h1 className="text-3xl font-bold tracking-tight">Bills awaiting review</h1>
      </div>

      {!loading && !isAdmin && (
        <div
          data-testid="admins-only"
          className="mb-8 rounded-xl border border-amber-400/40 bg-amber-50 p-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <p className="text-lg font-semibold">Admins only</p>
          <p className="mt-1 text-sm">
            You need an admin account to review real submissions. Below is a demo queue with sample
            bills — actions here are not saved.
          </p>
          <Link to="/" className="mt-3 inline-block text-sm font-medium underline">
            Back to home
          </Link>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading review queue…</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {bills.map((bill) => {
            const msg = MESSAGES[bill.status];
            const busy = busyId === bill.id;
            return (
              <article
                key={bill.id}
                data-testid="review-card"
                data-status={bill.status}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
              >
                <img src={bill.imageUrl} alt={bill.title} className="h-40 w-full object-cover" />
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                    <span>{bill.category}</span>
                    <span>{bill.status}</span>
                  </div>
                  <h2 className="text-lg font-semibold">{bill.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {bill.biller} · submitted by {bill.submittedBy}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">{formatAmount(bill.raised)}</span> raised of{" "}
                    {formatAmount(bill.amount)}
                  </p>

                  {bill.proofFiles.length > 0 ? (
                    <div data-testid="review-proofs" className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Proof files ({bill.proofFiles.length})
                      </p>
                      <ul className="grid grid-cols-3 gap-2">
                        {bill.proofFiles.map((file, index) => {
                          const isImage =
                            (file.type || "").startsWith("image/") ||
                            /\.(png|jpe?g|webp|gif)$/i.test(file.url);
                          return (
                            <li key={`${file.url}-${index}`}>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="review-proof"
                                className="block overflow-hidden rounded-lg border border-border hover:bg-muted"
                              >
                                {isImage ? (
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="h-20 w-full object-cover"
                                  />
                                ) : (
                                  <span className="flex h-20 items-center justify-center bg-muted text-xs font-bold text-muted-foreground">
                                    PDF
                                  </span>
                                )}
                                <span className="block truncate px-2 py-1 text-xs">{file.name}</span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}

                  {bill.status === "rejected" && (
                    <div
                      data-testid="review-rejection-reason"
                      className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"
                    >
                      <p className="font-semibold">Rejected — reason sent to the poster</p>
                      <p className="mt-1">{bill.rejectionReason ?? "No reason recorded."}</p>
                      <p className="mt-2 text-xs">
                        {bill.resubmissionCount >= 1
                          ? "The poster has used their one resubmission; this rejection is final."
                          : "The poster can fix and resend once."}
                      </p>
                    </div>
                  )}

                  {bill.status === "pending" && (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => act(bill, approveBill)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4" /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openRejectBox(bill)}
                          aria-expanded={rejectingId === bill.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <X className="h-4 w-4" /> Reject
                        </button>
                      </div>

                      {rejectingId === bill.id && (
                        <div
                          data-testid="reject-box"
                          className="space-y-2 rounded-xl border border-red-300 bg-red-50 p-3 text-red-900 dark:bg-red-950/30 dark:text-red-100"
                        >
                          <label
                            htmlFor={`reject-reason-${bill.id}`}
                            className="block text-sm font-semibold"
                          >
                            Reason for rejection (shown to the poster)
                          </label>
                          <textarea
                            id={`reject-reason-${bill.id}`}
                            rows={3}
                            value={reasonDrafts[bill.id] ?? ""}
                            onChange={(e) =>
                              setReasonDrafts((d) => ({ ...d, [bill.id]: e.target.value }))
                            }
                            placeholder="Explain exactly what needs fixing…"
                            className="w-full rounded-lg border border-red-300 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                          />
                          {reasonErrors[bill.id] ? (
                            <p
                              role="alert"
                              data-testid="reject-reason-error"
                              className="text-sm font-medium text-red-700 dark:text-red-300"
                            >
                              {reasonErrors[bill.id]}
                            </p>
                          ) : null}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => confirmReject(bill)}
                              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Confirm rejection
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setRejectingId(null);
                                setReasonErrors((e) => ({ ...e, [bill.id]: "" }));
                              }}
                              className="rounded-lg border border-red-400 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100/60 disabled:opacity-50 dark:text-red-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {bill.status === "funded" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(bill, markPaidToBiller)}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Mark paid to biller
                    </button>
                  )}

                  {msg && (
                    <p role="status" className="text-sm font-semibold text-emerald-700">
                      {msg}
                    </p>
                  )}
                  {errors[bill.id] && (
                    <p role="alert" className="text-sm text-red-600">
                      {errors[bill.id]}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
