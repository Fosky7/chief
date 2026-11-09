import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminQueue } from "@/hooks/useAdminQueue";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin review — Chief" },
      { name: "description", content: "Review, approve and pay out submitted bills." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const {
    bills,
    loading,
    error,
    isAdmin,
    checkingAdmin,
    pendingActionId,
    approve,
    reject,
    markPaid,
  } = useAdminQueue();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data?.user) {
        window.location.replace(`/auth?redirect=${encodeURIComponent("/admin")}`);
        return;
      }
      setCheckingAuth(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handle = async (label: string, action: (id: string) => Promise<unknown>, id: string) => {
    setMessage(null);
    try {
      await action(id);
      setMessage(label);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "That action did not go through.");
    }
  };

  if (checkingAuth || checkingAdmin) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Bills awaiting review</h1>
        <p className="mt-3 text-sm text-slate-500">Checking your admin access…</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Bills awaiting review</h1>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Admins only
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-indigo-600">
          Back to home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Bills awaiting review</h1>
        <Link to="/" className="text-sm font-semibold text-indigo-600">
          Back to home
        </Link>
      </div>

      {message ? (
        <p
          role="status"
          data-testid="admin-message"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {message}
        </p>
      ) : null}

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading the review queue…</p> : null}
      {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

      {!loading && !error && bills.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No bills are in the review queue yet.</p>
      ) : null}

      <ul className="mt-6 space-y-4">
        {bills.map((bill) => {
          const status = bill.status.toLowerCase();
          const isPending = status === "pending" || status === "submitted" || status === "draft";
          const canPay = status === "approved" || status === "funded" || bill.raised_amount > 0;
          const busy = pendingActionId === bill.id;

          return (
            <li
              key={bill.id}
              data-testid="admin-bill-card"
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 data-testid="admin-bill-title" className="text-lg font-semibold text-slate-900">
                    {bill.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {bill.chamber ?? "Chamber not set"} · {bill.sponsor ?? "Unknown sponsor"}
                  </p>
                </div>
                <span
                  data-testid="admin-bill-status"
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700"
                >
                  {isPending ? "Pending review" : bill.status}
                </span>
              </div>

              {bill.summary ? (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{bill.summary}</p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {isPending ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handle("Bill approved", approve, bill.id)}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handle("Bill rejected", reject, bill.id)}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {canPay ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handle("Paid out", markPaid, bill.id)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
                  >
                    Mark paid to biller
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
