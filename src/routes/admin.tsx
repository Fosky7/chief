import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminQueue } from "@/hooks/useAdminQueue";
import { approveBill, markBillPaid, rejectBill, updateDonationStatus } from "@/services/admin";
import { formatNaira } from "@/lib/currency";
import { GlowBackdrop } from "@/components/ui/brand";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin review — Kross" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { bills, donations, isAdmin, loading, error, reload } = useAdminQueue();
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(label: string, action: () => Promise<unknown>) {
    setNotice(null);
    setActionError(null);
    try {
      await action();
      setNotice(label);
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "The action failed.");
    }
  }

  return (
    <main className="relative min-h-dvh px-4 py-10">
      <GlowBackdrop />
      <div className="relative mx-auto w-full max-w-3xl">
        <Link to="/" className="mb-6 inline-flex text-sm text-muted-foreground">
          Back home
        </Link>

        {loading ? <p className="text-muted-foreground">Loading review queue…</p> : null}

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {!loading && !error && !isAdmin ? (
          <section>
            <h1 className="text-3xl font-semibold tracking-tight">Admins only</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This review queue is available to signed-in administrators.
            </p>
          </section>
        ) : null}

        {!loading && !error && isAdmin ? (
          <section>
            <h1 className="text-3xl font-semibold tracking-tight">Bills awaiting review</h1>

            {notice ? (
              <p role="status" className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm font-medium text-primary">
                {notice}
              </p>
            ) : null}
            {actionError ? (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {actionError}
              </p>
            ) : null}

            {bills.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No bills are waiting for review.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {bills.map((bill) => (
                  <li key={bill.id} className="rounded-2xl border border-border bg-card p-5">
                    <h2 className="text-lg font-semibold">{bill.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatNaira(bill.amount)} • {bill.status}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void run("Bill approved", () => approveBill(bill.id))}
                        className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void run("Bill rejected", () => rejectBill(bill.id))}
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => void run("Paid out", () => markBillPaid(bill.id))}
                        className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                      >
                        Mark paid to biller
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-10">
              <h2 className="text-xl font-semibold tracking-tight">Contributions awaiting approval</h2>
              {donations.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No contributions are awaiting approval.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {donations.map((donation) => (
                    <li key={donation.id} className="rounded-2xl border border-border bg-card p-5">
                      <p className="font-medium">{donation.billTitle ?? donation.billId}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatNaira(donation.amount)} • {donation.status}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void run("Contribution approved", () =>
                              updateDonationStatus(donation.id, "approved"),
                            )
                          }
                          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                        >
                          Approve contribution
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void run("Contribution rejected", () =>
                              updateDonationStatus(donation.id, "rejected"),
                            )
                          }
                          className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
                        >
                          Reject contribution
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
