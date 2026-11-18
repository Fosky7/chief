import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { GlowBackdrop } from "@/components/ui/brand";
import { DonationSheet, SwipeCard } from "@/components/SwipeCard";
import { useDiscoverBills, type BillDetail } from "@/hooks/useBillRealtime";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover bills — Chief" },
      { name: "description", content: "Swipe through verified bills and donate securely with Paystack." },
    ],
  }),
  component: DiscoverPage,
});

/** Read by the dashboard (key matches /approv/). */
const APPROVED_KEY = "chief:approved-bills";

function rememberApproved(id: string) {
  try {
    const list = JSON.parse(localStorage.getItem(APPROVED_KEY) ?? "[]");
    const ids: string[] = Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
    if (!ids.includes(id)) ids.push(id);
    localStorage.setItem(APPROVED_KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable — ignore */
  }
}

function DiscoverPage() {
  const { bills, loading, error, live, reload } = useDiscoverBills();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [donating, setDonating] = useState<BillDetail | null>(null);
  const [thankedId, setThankedId] = useState<string | null>(null);

  // Handle Paystack's redirect back: /discover?bill=<id>&reference=<ref>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billId = params.get("bill");
    const reference = params.get("reference") ?? params.get("trxref");
    if (!billId || !reference) return;
    setThankedId(billId);
    window.history.replaceState(null, "", window.location.pathname);
    // Fallback refreshes in case realtime isn't delivering yet.
    const timers = [2500, 6000, 12000].map((ms) => window.setTimeout(() => void reload(), ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reload]);

  const queue = useMemo(() => {
    const visible = bills.filter((b) => !dismissed.includes(b.id) || b.id === thankedId);
    if (!thankedId) return visible;
    // Bring the bill the donor just paid for to the front.
    return [...visible.filter((b) => b.id === thankedId), ...visible.filter((b) => b.id !== thankedId)];
  }, [bills, dismissed, thankedId]);

  // Keep the open sheet in sync with live raised amounts.
  const donatingLive = donating ? (bills.find((b) => b.id === donating.id) ?? donating) : null;

  function dismiss(bill: BillDetail) {
    setDismissed((d) => [...d, bill.id]);
    if (bill.id === thankedId) setThankedId(null);
  }

  function help(bill: BillDetail) {
    rememberApproved(bill.id);
    dismiss(bill);
  }

  const [top, ...rest] = queue;

  return (
    <div className="relative isolate">
      <GlowBackdrop className="opacity-60" />
      <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Discover bills</h1>
          {live && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden="true" /> Live
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Swipe right to help, left to skip — or donate straight away.
        </p>

        <div className="mt-8">
          {loading ? (
            <p aria-busy="true" className="text-sm text-muted-foreground">
              Loading bills…
            </p>
          ) : error ? (
            <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
              <p className="font-semibold">We couldn't load bills.</p>
              <p className="mt-1">{error}</p>
              <button type="button" onClick={() => void reload()} className="mt-3 font-semibold underline">
                Try again
              </button>
            </div>
          ) : bills.length === 0 ? (
            <div data-testid="discover-empty" className="glass rounded-3xl p-8 text-center">
              <p className="font-semibold text-foreground">No bills to discover yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Verified bills appear here once our team approves them.
              </p>
              <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
                Back to home
              </Link>
            </div>
          ) : !top ? (
            <div data-testid="discover-done" className="glass rounded-3xl p-8 text-center">
              <p className="font-semibold text-foreground">You're all caught up</p>
              <button
                type="button"
                onClick={() => setDismissed([])}
                className="mt-4 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Start over
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <SwipeCard
                key={top.id}
                bill={top}
                thanked={top.id === thankedId}
                onSkip={dismiss}
                onHelp={help}
                onDonate={setDonating}
              />
              {rest.length > 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  {rest.length} more {rest.length === 1 ? "bill" : "bills"} waiting
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {donatingLive && <DonationSheet bill={donatingLive} onClose={() => setDonating(null)} />}
    </div>
  );
}
