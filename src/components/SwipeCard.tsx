import { useState } from "react";
import { Check, X } from "lucide-react";

export interface SwipeBill {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  amount?: number | null;
  funded?: number | null;
}

export interface SwipeCardProps {
  bill: SwipeBill;
  onVote?: (vote: "yes" | "no") => void | Promise<void>;
  pending?: boolean;
  error?: string | null;
}

function naira(value?: number | null) {
  return `\u20a6${Number(value ?? 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export function SwipeCard({ bill, onVote, pending = false, error = null }: SwipeCardProps) {
  const [localPending, setLocalPending] = useState<"yes" | "no" | null>(null);
  const busy = pending || localPending !== null;

  const amount = Number(bill.amount ?? 0);
  const funded = Number(bill.funded ?? 0);
  const percent = amount > 0 ? Math.min(100, Math.round((funded / amount) * 100)) : 0;

  const vote = async (choice: "yes" | "no") => {
    if (busy || !onVote) return;
    setLocalPending(choice);
    try {
      await onVote(choice);
    } finally {
      setLocalPending(null);
    }
  };

  return (
    <article
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
      data-testid="swipe-card"
      data-bill-id={bill.id}
    >
      {bill.category ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{bill.category}</p>
      ) : null}
      <h2 className="mt-2 text-xl font-semibold text-slate-900">{bill.title}</h2>
      {bill.description ? (
        <p className="mt-2 text-sm text-slate-600">{bill.description}</p>
      ) : null}

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span data-testid="swipe-raised">Raised {naira(funded)}</span>
        <span>{naira(amount)} target</span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          data-testid="swipe-no"
          onClick={() => void vote("no")}
          disabled={busy}
          aria-busy={busy}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 text-slate-600 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Pass on this bill</span>
        </button>
        <button
          type="button"
          data-testid="swipe-yes"
          onClick={() => void vote("yes")}
          disabled={busy}
          aria-busy={busy}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white disabled:opacity-50"
        >
          <Check className="h-5 w-5" />
          <span className="sr-only">Back this bill</span>
        </button>
      </div>

      {localPending ? (
        <p className="mt-3 text-center text-sm text-slate-500" data-testid="vote-pending">
          Recording your vote\u2026
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-center text-sm text-red-600" data-testid="vote-error">
          {error}
        </p>
      ) : null}
    </article>
  );
}
