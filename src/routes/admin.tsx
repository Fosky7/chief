import { createFileRoute, Link } from "@tanstack/react-router";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { CategoryBadge, GlowBackdrop, GradientButton } from "@/components/ui/brand";
import { useAdminQueue, type AdminQueueBill } from "@/hooks/useAdminQueue";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin review — Chief" }],
  }),
  component: AdminPage,
});

type BadgeCategory = Parameters<typeof CategoryBadge>[0]["category"];

const shimmer =
  "animate-shimmer rounded-2xl bg-[linear-gradient(90deg,var(--muted)_0%,var(--card)_50%,var(--muted)_100%)]";

function asBadgeCategory(value: string | null): BadgeCategory | null {
  if (!value) return null;
  return value as BadgeCategory;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/**
 * Admin review & approval queue (Module 5).
 *
 * The page always renders its "Bills awaiting review" heading so a direct load
 * of /admin is legible immediately; the body then switches between the loading
 * skeletons, the "Admins only" gate (signed-out / non-admin), a read error, and
 * the real queue (pending bills to approve/reject, funded bills to pay out).
 */
function AdminPage() {
  const queue = useAdminQueue();

  return (
    <div className="relative isolate min-h-[70vh]">
      <GlowBackdrop className="opacity-60" />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Moderation</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Bills awaiting review
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Verify the invoice and biller details before a bill reaches the swipe deck. Approved
              bills go live for donors immediately; rejected bills never appear.
            </p>
          </div>
          {queue.isAdmin ? (
            <button
              type="button"
              onClick={() => void queue.refresh()}
              disabled={queue.loading}
              className="glass focus-visible:ring-ring inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
            >
              <span aria-hidden="true">↻</span> Refresh queue
            </button>
          ) : null}
        </div>

        {queue.actionMessage ? (
          <p
            role="status"
            data-testid="admin-action-message"
            className="border-success/40 bg-success/10 text-success mt-6 rounded-2xl border px-5 py-3 text-sm font-semibold"
          >
            {queue.actionMessage}
          </p>
        ) : null}
        {queue.actionError ? (
          <p
            role="alert"
            data-testid="admin-action-error"
            className="border-destructive/40 bg-destructive/10 text-destructive mt-3 rounded-2xl border px-5 py-3 text-sm font-semibold"
          >
            {queue.actionError}
          </p>
        ) : null}

        {queue.loading ? (
          <QueueSkeleton />
        ) : queue.blocked ? (
          <GatePanel
            message={queue.gateMessage ?? "Admins only"}
            detail={queue.gateDetail}
            signedOut={queue.phase === "signed-out"}
          />
        ) : queue.error ? (
          <ErrorPanel message={queue.error} onRetry={() => void queue.refresh()} />
        ) : (
          <>
            <PendingQueue
              bills={queue.pendingBills}
              busyId={queue.busyId}
              onApprove={(id) => void queue.approve(id)}
              onReject={(id) => void queue.reject(id)}
            />
            <FundedQueue
              bills={queue.fundedBills}
              busyId={queue.busyId}
              onMarkPaid={(id) => void queue.markPaid(id)}
            />
            <div className="mt-12">
              <Link
                to="/discover"
                className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              >
                <span aria-hidden="true">←</span> Back to the deck
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="mt-10" aria-busy="true">
      <p className="sr-only">Loading the review queue…</p>
      <div aria-hidden="true" className={`h-8 w-56 ${shimmer}`} />
      {[0, 1, 2].map((i) => (
        <div key={i} aria-hidden="true" className={`mt-4 h-36 w-full ${shimmer}`} />
      ))}
    </div>
  );
}

function GatePanel({
  message,
  detail,
  signedOut,
}: {
  message: string;
  detail: string | null;
  signedOut: boolean;
}) {
  return (
    <div
      data-testid="admin-gate"
      className="glass shadow-elegant animate-fade-up mt-10 overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12"
    >
      <div
        aria-hidden="true"
        className="bg-brand-gradient mx-auto h-20 w-20 rounded-[40%_60%_55%_45%/50%_45%_55%_50%] opacity-80 blur-[2px]"
      />
      <p className="mt-6 font-display text-2xl font-semibold">{message}</p>
      {detail ? <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{detail}</p> : null}
      {signedOut ? (
        <GradientButton to="/auth" size="lg" className="mt-6">
          Sign in to review
        </GradientButton>
      ) : null}
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="glass shadow-elegant mt-10 rounded-3xl px-6 py-10 text-center">
      <p role="alert" className="text-destructive text-sm font-semibold">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="glass focus-visible:ring-ring mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2"
      >
        Try again
      </button>
    </div>
  );
}

function PendingQueue({
  bills,
  busyId,
  onApprove,
  onReject,
}: {
  bills: AdminQueueBill[];
  busyId: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <section aria-labelledby="pending-heading" className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="pending-heading" className="font-display text-2xl font-semibold">
          Awaiting review
        </h2>
        <span className="glass rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground">
          {bills.length} {bills.length === 1 ? "bill" : "bills"} waiting
        </span>
      </div>
      {bills.length === 0 ? (
        <div
          data-testid="admin-queue-empty"
          className="glass mt-4 rounded-2xl px-5 py-8 text-center text-muted-foreground"
        >
          No bills are waiting for review right now.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {bills.map((bill) => (
            <PendingCard
              key={bill.id}
              bill={bill}
              busy={busyId === bill.id}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PendingCard({
  bill,
  busy,
  onApprove,
  onReject,
}: {
  bill: AdminQueueBill;
  busy: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const pct = fundedPercent(bill.raised, bill.goal);
  const category = asBadgeCategory(bill.category);
  const due = formatDate(bill.dueDate);
  const meta = [
    bill.city,
    bill.biller,
    bill.requesterName ? `Posted by ${bill.requesterName}` : null,
  ]
    .filter((part): part is string => Boolean(part && part.trim() !== ""))
    .join(" · ");

  return (
    <article
      data-testid="admin-queue-card"
      className="glass shadow-elegant animate-fade-up flex flex-col gap-5 rounded-3xl p-5 sm:flex-row sm:items-start"
    >
      <div className="bg-brand-gradient relative h-32 w-full shrink-0 overflow-hidden rounded-2xl sm:h-28 sm:w-40">
        {bill.photoUrl ? (
          <img
            src={bill.photoUrl}
            alt={bill.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-brand-saffron/20 text-brand-saffron rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
            Pending review
          </span>
          {category ? <CategoryBadge category={category} /> : null}
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-foreground">{bill.title}</h3>
        {meta ? <p className="mt-1 text-sm text-muted-foreground">{meta}</p> : null}
        <p className="mt-2 text-sm">
          <span className="font-semibold text-foreground">{formatNaira(bill.raised)}</span>
          <span className="text-muted-foreground">
            {" "}raised of {formatNaira(bill.goal)} · {pct}% funded
          </span>
        </p>
        {due ? <p className="mt-1 text-xs text-muted-foreground">Due {due}</p> : null}
        {bill.story ? (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{bill.story}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
        <button
          type="button"
          onClick={() => onApprove(bill.id)}
          disabled={busy}
          aria-busy={busy}
          className="bg-brand-gradient shadow-elegant inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(bill.id)}
          disabled={busy}
          aria-busy={busy}
          className="border-destructive/40 text-destructive hover:bg-destructive/10 inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Reject
        </button>
      </div>
    </article>
  );
}

function FundedQueue({
  bills,
  busyId,
  onMarkPaid,
}: {
  bills: AdminQueueBill[];
  busyId: string | null;
  onMarkPaid: (id: string) => void;
}) {
  return (
    <section aria-labelledby="funded-heading" className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="funded-heading" className="font-display text-2xl font-semibold">
          Funded bills ready to pay out
        </h2>
        <span className="glass rounded-full px-3 py-1 text-xs font-semibold text-muted-foreground">
          {bills.length} {bills.length === 1 ? "bill" : "bills"}
        </span>
      </div>
      {bills.length === 0 ? (
        <div
          data-testid="admin-funded-empty"
          className="glass mt-4 rounded-2xl px-5 py-8 text-center text-muted-foreground"
        >
          No approved bill has reached its goal yet.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {bills.map((bill) => (
            <FundedCard
              key={bill.id}
              bill={bill}
              busy={busyId === bill.id}
              onMarkPaid={onMarkPaid}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FundedCard({
  bill,
  busy,
  onMarkPaid,
}: {
  bill: AdminQueueBill;
  busy: boolean;
  onMarkPaid: (id: string) => void;
}) {
  const pct = fundedPercent(bill.raised, bill.goal);

  return (
    <article
      data-testid="admin-funded-card"
      className="glass shadow-elegant animate-fade-up flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-success/15 text-success rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em]">
            Funded · {pct}%
          </span>
        </div>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-foreground">{bill.title}</h3>
        <p className="mt-1 text-sm">
          <span className="font-semibold text-foreground">{formatNaira(bill.raised)}</span>
          <span className="text-muted-foreground"> raised of {formatNaira(bill.goal)}</span>
        </p>
        {bill.biller ? (
          <p className="mt-1 text-sm text-muted-foreground">Paying {bill.biller}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onMarkPaid(bill.id)}
        disabled={busy}
        aria-busy={busy}
        className="bg-brand-gradient shadow-elegant inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Mark paid to biller
      </button>
    </article>
  );
}
