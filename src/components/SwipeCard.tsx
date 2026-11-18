import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira, fundedPercent } from "@/lib/currency";
import { CategoryBadge, ProgressBar } from "@/components/ui/brand";
import type { BillDetail } from "@/hooks/useBillRealtime";

type BadgeCategory = Parameters<typeof CategoryBadge>[0]["category"];

const SWIPE_THRESHOLD = 120;

type SwipeCardProps = {
  bill: BillDetail;
  active?: boolean;
  thanked?: boolean;
  onSkip?: (bill: BillDetail) => void;
  onHelp?: (bill: BillDetail) => void;
  onDonate: (bill: BillDetail) => void;
};

/** A swipeable bill card. Drag right to help, left to skip, or use the buttons. */
export function SwipeCard({ bill, active = true, thanked = false, onSkip, onHelp, onDonate }: SwipeCardProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const pct = fundedPercent(bill.raised, bill.goal);
  const remaining = Math.max(bill.goal - bill.raised, 0);
  const canDonate = bill.status === "approved" && remaining > 0;

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (!active) return;
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: ReactPointerEvent<HTMLElement>) {
    if (startX.current === null) return;
    setDx(e.clientX - startX.current);
  }

  function onPointerUp() {
    if (startX.current === null) return;
    startX.current = null;
    setDragging(false);
    if (dx > SWIPE_THRESHOLD) onHelp?.(bill);
    else if (dx < -SWIPE_THRESHOLD) onSkip?.(bill);
    setDx(0);
  }

  return (
    <article
      data-testid="swipe-card"
      data-bill-id={bill.id}
      aria-label={bill.title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        transform: `translateX(${dx}px) rotate(${dx / 20}deg)`,
        transition: dragging ? "none" : "transform 250ms ease",
        touchAction: "pan-y",
      }}
      className="ring-gradient shadow-elegant select-none overflow-hidden rounded-3xl bg-card"
    >
      <div className="bg-brand-gradient relative aspect-[4/3] overflow-hidden">
        {bill.imageUrl && (
          <img
            src={bill.imageUrl}
            alt={bill.title}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-4 top-4">
          <CategoryBadge category={bill.category as BadgeCategory} className="bg-card/90 backdrop-blur" />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{bill.city}</p>
          <h2 className="mt-1 text-xl font-semibold leading-snug text-foreground">{bill.title}</h2>
        </div>

        <ProgressBar value={bill.raised} goal={bill.goal} label={`${bill.title} funding progress`} />
        <dl className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">Raised</dt>
            <dd data-testid="card-raised" className="font-semibold text-foreground">
              {formatNaira(bill.raised)}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Goal</dt>
            <dd className="text-muted-foreground">
              {pct}% of {formatNaira(bill.goal)}
            </dd>
          </div>
        </dl>

        {thanked && (
          <p
            role="status"
            data-testid="card-thanks"
            className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
          >
            Thank you for giving
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={!active}
            onClick={() => onSkip?.(bill)}
            className="rounded-full border border-input px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-destructive/50 hover:text-destructive disabled:opacity-50"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={!canDonate}
            onClick={() => onDonate(bill)}
            className="bg-brand-gradient shadow-elegant rounded-full px-3 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Donate
          </button>
          <button
            type="button"
            disabled={!active}
            onClick={() => onHelp?.(bill)}
            className="rounded-full border border-input px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-success/50 hover:text-success disabled:opacity-50"
          >
            Help
          </button>
        </div>
        {!canDonate && (
          <p className="text-center text-xs text-muted-foreground">
            {remaining === 0 ? "This bill is fully funded. Thank you!" : "This bill isn't accepting donations."}
          </p>
        )}
      </div>
    </article>
  );
}

const PRESETS = [1000, 5000, 10000];

type InitResponse = {
  authorization_url?: string;
  authorizationUrl?: string;
  url?: string;
  error?: string;
};

/** "Choose an amount" sheet that starts a Paystack checkout for a bill. */
export function DonationSheet({ bill, onClose }: { bill: BillDetail; onClose: () => void }) {
  const navigate = useNavigate();
  const remaining = Math.max(bill.goal - bill.raised, 0);
  const [amount, setAmount] = useState<number>(Math.min(5000, Math.max(remaining, 100)));
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const chosen = custom ? Number(custom) : amount;
  const max = Math.max(remaining, 100);
  const valid = Number.isFinite(chosen) && chosen >= 100 && chosen <= max;

  async function pay() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        await navigate({ to: "/auth" });
        return;
      }
      const callbackUrl = `${window.location.origin}/discover?bill=${encodeURIComponent(bill.id)}`;
      const { data, error: fnError } = await supabase.functions.invoke<InitResponse>("paystack-initialize", {
        body: {
          billId: bill.id,
          bill_id: bill.id,
          amount: Math.round(chosen),
          amount_kobo: Math.round(chosen) * 100,
          email: user.email,
          callbackUrl,
          callback_url: callbackUrl,
        },
      });
      if (fnError) throw fnError;
      const url = data?.authorization_url ?? data?.authorizationUrl ?? data?.url;
      if (!url) throw new Error(data?.error ?? "Could not start Paystack checkout");
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start Paystack checkout");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="donate-sheet-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-md rounded-3xl bg-card p-6 shadow-elegant outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="donate-sheet-title" className="font-display text-2xl font-semibold">
              Choose an amount
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {bill.title} · {formatNaira(remaining)} still needed
            </p>
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

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Preset amounts">
          {PRESETS.map((p) => {
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
          <button
            type="button"
            aria-pressed={!custom && amount === remaining}
            disabled={remaining < 100}
            onClick={() => {
              setAmount(remaining);
              setCustom("");
            }}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:opacity-50 ${
              !custom && amount === remaining
                ? "border-primary bg-primary/10 text-primary"
                : "border-input hover:border-primary/50"
            }`}
          >
            Pay remaining
          </button>
        </div>

        <label className="mt-4 block text-sm font-semibold">
          Custom amount (₦)
          <input
            type="number"
            inputMode="numeric"
            min={100}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. 2500"
            className="mt-1.5 w-full rounded-xl border border-input bg-background/80 px-4 py-3 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
          />
        </label>

        <p data-testid="donate-summary" className="mt-3 text-sm text-muted-foreground">
          You're giving{" "}
          <span className="font-semibold text-foreground">{valid ? formatNaira(chosen) : "—"}</span>
        </p>
        {!valid && (
          <p className="mt-1 text-xs text-destructive">Enter between ₦100 and {formatNaira(max)}.</p>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!valid || busy}
          onClick={() => void pay()}
          className="bg-brand-gradient mt-6 w-full rounded-full px-6 py-3.5 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Opening Paystack…" : "Donate with Paystack"}
        </button>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Paid directly to the biller · Secured by Paystack
        </p>
      </div>
    </div>
  );
}
