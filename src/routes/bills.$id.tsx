import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatNaira } from "@/lib/currency";
import { GlowBackdrop } from "@/components/ui/brand";

export const Route = createFileRoute("/bills/$id")({
  head: () => ({
    meta: [
      { title: "Bill details — Kross" },
      { name: "description", content: "Review a community bill and contribute securely." },
    ],
  }),
  component: BillDetailPage,
});

type BillRow = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
};

type DonationRow = {
  id: string;
  amount: number;
  status: string;
  note: string | null;
  created_at: string;
};

function statusLabel(status: string) {
  if (status === "pending") return "Pending review";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status;
}

function BillDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [bill, setBill] = useState<BillRow | null>(null);
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [amount, setAmount] = useState("1000");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: billRow, error: billError } = await supabase
      .from("bills")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (billError) throw billError;
    setBill(billRow as BillRow | null);

    const { data: donationRows, error: donationError } = await supabase
      .from("donations")
      .select("*")
      .eq("bill_id", id)
      .order("created_at", { ascending: false });

    if (donationError) throw donationError;
    setDonations((donationRows ?? []) as DonationRow[]);
  }, [id]);

  useEffect(() => {
    load().catch((cause) =>
      setError(cause instanceof Error ? cause.message : "Unable to load this bill."),
    );
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`bill-donations-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "donations", filter: `bill_id=eq.${id}` },
        () => {
          load().catch(() => undefined);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id, load]);

  async function submitContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setError(null);

    if (!user) {
      setError("Sign in to contribute to this bill.");
      return;
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid contribution amount.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("donations").insert({
        bill_id: id,
        donor_id: user.id,
        amount: numericAmount,
        status: "pending",
        note: note.trim() || null,
      });

      if (insertError) throw insertError;

      setNote("");
      setNotice("Pending review");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "The contribution could not be recorded.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-dvh px-4 py-10">
      <GlowBackdrop />
      <div className="relative mx-auto w-full max-w-3xl">
        <Link to="/discover" className="mb-6 inline-flex text-sm text-muted-foreground">
          Back to discover
        </Link>

        {error ? (
          <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {!bill && !error ? <p className="text-muted-foreground">Loading bill…</p> : null}

        {bill ? (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">{bill.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{formatNaira(bill.amount)}</p>
            {bill.description ? <p className="mt-4 text-sm">{bill.description}</p> : null}

            <form onSubmit={submitContribution} className="mt-8 space-y-4 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">Contribute</h2>
              <label className="block text-sm font-medium">
                Amount
                <input
                  aria-label="Amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm font-medium">
                Note
                <textarea
                  aria-label="Note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Contribute"}
              </button>
              {notice ? (
                <p role="status" className="text-sm font-medium text-primary">
                  {notice}
                </p>
              ) : null}
            </form>

            <section className="mt-8">
              <h2 className="text-lg font-semibold">Contributions</h2>
              {donations.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No contributions yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {donations.map((donation) => (
                    <li key={donation.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                      <span>{formatNaira(donation.amount)}</span>
                      <span>{statusLabel(donation.status)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
