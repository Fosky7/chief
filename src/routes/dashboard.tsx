import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatNaira } from "@/lib/currency";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Kross" },
      { name: "description", content: "Track the bills you support and the ones you submitted." },
    ],
  }),
  component: DashboardPage,
});

interface MyDonation {
  id: string;
  amount: number;
  created_at: string;
  bill_title: string | null;
}

interface MyBill {
  id: string;
  title: string;
  status: string;
  amount: number;
}

function DashboardPage() {
  const auth = useAuth() as unknown as {
    user?: { id?: string; email?: string | null } | null;
    loading?: boolean;
  };
  const user = auth?.user ?? null;

  const [donations, setDonations] = useState<MyDonation[]>([]);
  const [bills, setBills] = useState<MyBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(userId: string | undefined) {
      if (!userId) {
        if (!cancelled) {
          setDonations([]);
          setBills([]);
          setLoading(false);
        }
        return;
      }

      try {
        const donationResult = await supabase
          .from("donations")
          .select("id,amount,created_at")
          .eq("donor_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        const billResult = await supabase
          .from("bills")
          .select("id,title,status,amount")
          .eq("created_by", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (cancelled) return;

        setDonations(
          (donationResult.data ?? []).map((row) => {
            const record = row as Record<string, unknown>;
            return {
              id: String(record.id ?? ""),
              amount: Number(record.amount ?? 0),
              created_at: String(record.created_at ?? ""),
              bill_title: null,
            };
          }),
        );

        setBills(
          (billResult.data ?? []).map((row) => {
            const record = row as Record<string, unknown>;
            return {
              id: String(record.id ?? ""),
              title: String(record.title ?? "Untitled bill"),
              status: String(record.status ?? "pending"),
              amount: Number(record.amount ?? 0),
            };
          }),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load(user?.id);

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <main className="min-h-dvh bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold">
          {user?.email ? `Welcome back, ${user.email}` : "Welcome back"}
        </h1>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={"/admin" as never}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Admin review
          </Link>
          <Link
            to={"/discover" as never}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Discover bills
          </Link>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading your activity…</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">Bills you submitted</h2>
              {bills.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">You have not submitted a bill yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {bills.map((bill) => (
                    <li key={bill.id} className="text-sm">
                      <Link
                        to={"/bills/$id" as never}
                        params={{ id: bill.id } as never}
                        className="font-medium hover:underline"
                      >
                        {bill.title}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {bill.status} · {formatNaira(bill.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold">Your donations</h2>
              {donations.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">You have not donated yet.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {donations.map((donation) => (
                    <li key={donation.id} className="text-sm text-muted-foreground">
                      {formatNaira(donation.amount)}
                      {donation.bill_title ? ` · ${donation.bill_title}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
