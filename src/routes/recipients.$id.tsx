import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { BillBreakdown } from "@/components/BillBreakdown";
import {
  buttons,
  categoryAccent,
  gradients,
  layout,
  typography,
} from "@/config/theme";
import { recordContribution } from "@/lib/contributions";
import { findRecipient, formatNaira, type Recipient } from "@/lib/recipients";

/**
 * Recipient detail page (`/recipients/$id`).
 *
 * Reads its own URL param, resolves the seeded recipient and renders:
 *  - the verified request hero (who, where, how much is still needed),
 *  - the provider-verified "Bill breakdown",
 *  - the long-form story,
 *  - the action rail with "Pay this bill" (simulated payment) and
 *    "Back to discover".
 *
 * Paying flips local state, which zeroes the outstanding amount and reveals the
 * "Contribution confirmed" panel inside a polite live region.
 */

const backLink =
  "inline-flex items-center gap-1.5 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const verifiedPill =
  "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm";

function RecipientNotFound({ id }: { id: string }) {
  return (
    <AppShell>
      <section className={`${layout.container} ${layout.section}`}>
        <p className={typography.eyebrow}>Request unavailable</p>
        <h1 className={`mt-3 ${typography.display}`}>Request not found</h1>
        <p className={`mt-4 max-w-2xl ${typography.body}`}>
          We could not find a verified request for “{id}”. It may have been fully
          funded and archived. The live queue still has other bills that need a
          hand.
        </p>
        <Link to="/discover" className={`${buttons.primary} mt-8`}>
          Back to discover
        </Link>
      </section>
    </AppShell>
  );
}

function RecipientDetail({ recipient }: { recipient: Recipient }) {
  const [contributed, setContributed] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);

  const accent = categoryAccent(recipient.category);

  // Once the recipient has been paid, the outstanding amount is settled.
  const remaining = contributed ? 0 : recipient.stillNeeded;
  const pledged = Math.max(recipient.amount - remaining, 0);
  const percentPledged =
    recipient.amount > 0
      ? Math.min(100, Math.round((pledged / recipient.amount) * 100))
      : 0;

  // Deterministic reference so the confirmation never changes between renders.
  const reference = `PAY-${recipient.id
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 8)}`;

  // Bring the confirmation into view after the payment lands.
  useEffect(() => {
    if (!contributed) return undefined;
    const node = statusRef.current;
    if (!node || typeof node.scrollIntoView !== "function") return undefined;
    const frame = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [contributed]);

  return (
    <AppShell>
      <section className={`border-b border-border ${gradients.heroAurora}`}>
        <div className={`${layout.container} py-10 sm:py-14`}>
          <Link to="/discover" className={backLink}>
            <span aria-hidden="true">←</span> Back to discover
          </Link>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <img
              src={recipient.imageUrl}
              alt={`Portrait of ${recipient.name}`}
              loading="lazy"
              className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-border"
            />
            <div className="min-w-0">
              <span className={`${verifiedPill} ${accent.gradient}`}>
                Verified request
              </span>
              <h1 className={`mt-3 ${typography.display}`}>{recipient.name}</h1>
              <p className={`mt-2 ${typography.caption}`}>
                {recipient.location} · Verified {recipient.verifiedOn}
              </p>
              <p className={`mt-4 max-w-2xl ${typography.body}`}>
                {recipient.note}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${layout.container} ${layout.section}`}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight">
                Why this bill
              </h2>
              <p className={`mt-3 ${typography.body}`}>{recipient.story}</p>

              <dl className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                <div>
                  <dt className={typography.caption}>Biller</dt>
                  <dd className="text-sm font-semibold">{recipient.biller}</dd>
                </div>
                <div>
                  <dt className={typography.caption}>Account number</dt>
                  <dd className="text-sm font-semibold tabular-nums">
                    {recipient.accountNumber}
                  </dd>
                </div>
                <div>
                  <dt className={typography.caption}>Category</dt>
                  <dd className={`text-sm font-semibold ${accent.text}`}>
                    {recipient.category}
                  </dd>
                </div>
                <div>
                  <dt className={typography.caption}>Due date</dt>
                  <dd className="text-sm font-semibold">{recipient.dueLabel}</dd>
                </div>
              </dl>
            </div>

            <BillBreakdown
              lineItems={recipient.breakdown}
              total={recipient.amount}
              stillNeeded={remaining}
              biller={recipient.biller}
              category={recipient.category}
              accountNumber={recipient.accountNumber}
              dueLabel={recipient.dueLabel}
            />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className={typography.caption}>Still needed</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
                {formatNaira(remaining)}
              </p>
              <p className={`mt-1 ${typography.caption}`}>
                Bill total {formatNaira(recipient.amount)} · {recipient.dueLabel}
              </p>

              <div
                role="progressbar"
                aria-label="Share of this bill already pledged"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentPledged}
                className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${accent.gradient}`}
                  style={{ width: `${percentPledged}%` }}
                />
              </div>
              <p className={`mt-2 ${typography.caption}`}>
                {percentPledged}% of this bill already pledged by donors
              </p>

              <button
                type="button"
                onClick={() => {
                  // Save the payment to the giving ledger (browser + database when signed in).
                  recordContribution({
                    recipientName: recipient.name,
                    amount: recipient.stillNeeded,
                    billerName: recipient.biller,
                    category: recipient.category,
                    recipientSlug: recipient.id,
                    source: "recipient-page",
                  });
                  setContributed(true);
                }}
                disabled={contributed}
                className={`${buttons.primary} mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60`}
              >
                Pay this bill
              </button>

              <Link
                to="/discover"
                className={`${buttons.secondary} mt-3 w-full justify-center`}
              >
                Back to discover
              </Link>

              <p className={`mt-3 text-center ${typography.caption}`}>
                This demo simulates the payment. No card is charged.
              </p>
            </div>

            <div ref={statusRef} role="status" aria-live="polite">
              {contributed ? (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground ${gradients.brandMark}`}
                    >
                      ✓
                    </span>
                    Contribution confirmed
                  </p>
                  <p className={`mt-2 ${typography.caption}`}>
                    You paid {formatNaira(recipient.stillNeeded)} towards{" "}
                    {recipient.biller} for {recipient.name}. The provider has been
                    notified and the bill is now paid in full.
                  </p>
                  <dl className={`mt-3 space-y-1 ${typography.caption}`}>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Reference</dt>
                      <dd className="font-medium text-foreground">{reference}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Account</dt>
                      <dd className="font-medium text-foreground tabular-nums">
                        {recipient.accountNumber}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Still needed</dt>
                      <dd className="font-medium text-foreground">
                        {formatNaira(0)}
                      </dd>
                    </div>
                  </dl>
                  <Link
                    to="/discover"
                    className={`${buttons.secondary} mt-4 w-full justify-center`}
                  >
                    Back to discover
                  </Link>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}

function RecipientDetailPage() {
  const { id } = Route.useParams();
  const recipient = findRecipient(id);

  if (!recipient) {
    return <RecipientNotFound id={id} />;
  }

  // Keyed so state (and the confirmation panel) resets when the URL changes.
  return <RecipientDetail key={recipient.id} recipient={recipient} />;
}

export const Route = createFileRoute("/recipients/$id")({
  component: RecipientDetailPage,
});

export default RecipientDetailPage;
