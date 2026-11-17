import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { CategoryBadge, GlowBackdrop, GradientButton, ProgressBar } from "@/components/ui/brand";
import { useBillRealtime, type BillDetail } from "@/hooks/useBillRealtime";

export const Route = createFileRoute("/bills/$id")({
  head: () => ({ meta: [{ title: "Bill details — Chief" }] }),
  component: BillPage,
});

type BadgeCategory = Parameters<typeof CategoryBadge>[0]["category"];

const shimmer =
  "animate-shimmer rounded-2xl bg-[linear-gradient(90deg,var(--muted)_0%,var(--card)_50%,var(--muted)_100%)]";

function formatDate(iso: string | null): string {
  if (!iso) return "Not set";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function BillPage() {
  const { id } = Route.useParams();
  const { bill, loading, error, live } = useBillRealtime(id);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-14" aria-busy="true">
        <p className="sr-only">Loading bill…</p>
        <div aria-hidden="true" className={`aspect-[16/7] w-full ${shimmer}`} />
        <div aria-hidden="true" className={`mt-8 h-10 w-2/3 ${shimmer}`} />
        <div aria-hidden="true" className={`mt-4 h-24 w-full ${shimmer}`} />
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="animate-fade-up mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-semibold">Bill not found</h1>
        <p className="mt-3 text-muted-foreground">
          {error ?? "This bill may have been removed or the link is incorrect."}
        </p>
        <GradientButton to="/discover" size="lg" className="mt-8">
          Browse bills
        </GradientButton>
      </div>
    );
  }

  return <BillView bill={bill} live={live} />;
}

function BillView({ bill, live }: { bill: BillDetail; live: boolean }) {
  const [donateOpen, setDonateOpen] = useState(false);
  const pct = fundedPercent(bill.raised, bill.goal);
  const remaining = Math.max(bill.goal - bill.raised, 0);
  const pending = bill.status === "pending";
  const canDonate = bill.status === "approved" && remaining > 0;

  return (
    <div className="relative isolate">
      <GlowBackdrop className="opacity-60" />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <span aria-hidden="true">←</span> All bills
        </Link>

        {pending && (
          <div
            role="status"
            className="mt-4 flex items-start gap-3 rounded-2xl border border-brand-saffron/40 bg-brand-saffron/15 px-5 py-4"
          >
            <span aria-hidden="true" className="mt-0.5 text-lg">⏳</span>
            <div>
              <p className="font-semibold text-foreground">Pending review</p>
              <p className="text-sm text-muted-foreground">
                Our team is verifying the invoice and biller details. Donations open once it's approved.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <article className="animate-fade-up">
            <div className="bg-brand-gradient relative aspect-[16/9] overflow-hidden rounded-3xl shadow-elegant">
              {bill.imageUrl && (
                <img src={bill.imageUrl} alt={bill.title} className="absolute inset-0 h-full w-full object-cover" />
              )}
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute left-4 top-4">
                <CategoryBadge category={bill.category as BadgeCategory} className="bg-card/90 backdrop-blur" />
              </div>
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {bill.city}
              {bill.requesterName ? ` · Posted by ${bill.requesterName}` : ""}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {bill.title}
            </h1>

            <section aria-labelledby="story-heading" className="mt-8">
              <h2 id="story-heading" className="text-xl font-semibold">
                Story
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                {bill.story || "The requester hasn't added a story yet."}
              </p>
            </section>

            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="glass rounded-2xl p-5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Biller</dt>
                <dd className="mt-1.5 font-semibold text-foreground">{bill.biller}</dd>
              </div>
              <div className="glass rounded-2xl p-5">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due date</dt>
                <dd className="mt-1.5 font-semibold text-foreground">{formatDate(bill.dueDate)}</dd>
              </div>
            </dl>
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <section
              aria-label="Funding progress"
              className="glass ring-gradient shadow-elegant animate-fade-up rounded-3xl p-6"
              style={{ animationDelay: "120ms" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Progress</h2>
                {live && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden="true" /> Live
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm" data-testid="bill-progress-text">
                <span className="font-display text-3xl font-semibold text-foreground">{formatNaira(bill.raised)}</span>
                <span className="text-muted-foreground"> raised of {formatNaira(bill.goal)}</span>
              </p>
              <ProgressBar value={bill.raised} goal={bill.goal} className="mt-4" label={`${bill.title} funding progress`} />
              <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                <span>{pct}% funded</span>
                <span>{formatNaira(remaining)} to go</span>
              </div>
              {bill.donorCount !== null && (
                <p className="mt-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{bill.donorCount}</span>{" "}
                  {bill.donorCount === 1 ? "donor" : "donors"} so far
                </p>
              )}

              <button
                type="button"
                onClick={() => setDonateOpen(true)}
                disabled={!canDonate}
                className="bg-brand-gradient shadow-elegant mt-6 w-full rounded-full px-6 py-3.5 text-base font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Donate
              </button>
              {!canDonate && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  {pending
                    ? "Donations open after review."
                    : remaining === 0
                      ? "This bill is fully funded. Thank you!"
                      : "This bill isn't accepting donations."}
                </p>
              )}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Paid directly to the biller · Secured by Paystack
              </p>
            </section>
          </aside>
        </div>
      </div>

      {donateOpen && <DonateDialog bill={bill} remaining={remaining} onClose={() => setDonateOpen(false)} />}
    </div>
  );
}

const presets = [1000, 2000, 5000, 10000, 20000];

function DonateDialog({ bill, remaining, onClose }: { bill: BillDetail; remaining: number; onClose: () => void }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(5000);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chosen = custom ? Number(custom) : amount;
  const valid = Number.isFinite(chosen) && chosen >= 100 && chosen <= Math.max(remaining, 100);

  async function proceed() {
    if (!valid) return;
    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    if (!data.user) {
      await navigate({ to: "/auth" });
      return;
    }
    setNote(`You're giving ${formatNaira(chosen)} to "${bill.title}". Secure checkout opens next.`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donate-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-md rounded-3xl bg-card p-6 shadow-elegant outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="donate-title" className="font-display text-2xl font-semibold">
              Choose an amount
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{formatNaira(remaining)} still needed</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-muted-foreground transition hover:bg-muted"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2" role="group" aria-label="Preset amounts">
          {presets.map((p) => {
            const selected = !custom && amount === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setAmount(p);
                  setCustom("");
                }}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                  selected ? "border-primary bg-primary/10 text-primary" : "border-input hover:border-primary/50"
                }`}
              >
                {formatNaira(p)}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-sm font-semibold">
          Custom amount (₦)
          <input
            type="number"
            inputMode="numeric"
            min={100}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. 7500"
            className="mt-1.5 w-full rounded-xl border border-input bg-background/80 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
        </label>
        {!valid && (
          <p className="mt-2 text-xs text-destructive">Enter between ₦100 and {formatNaira(Math.max(remaining, 100))}.</p>
        )}

        <button
          type="button"
          disabled={!valid}
          onClick={() => void proceed()}
          className="bg-brand-gradient mt-6 w-full rounded-full px-6 py-3.5 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          Continue to Paystack · {valid ? formatNaira(chosen) : "—"}
        </button>
        {note && (
          <p role="status" className="mt-3 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
            {note}
          </p>
        )}
      </div>
    </div>
  );
}
