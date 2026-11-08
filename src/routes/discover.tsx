import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { formatNaira, fundedPercent, toAmount } from "@/lib/currency";
import { CategoryBadge, ProgressBar } from "@/components/ui/brand";
import { useApprovedBills, type DeckBill } from "@/hooks/useApprovedBills";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [{ title: "Discover bills — Chief" }],
  }),
  component: DiscoverPage,
});

// Left accent bar colour per category, using design tokens only.
const accentClass: Record<string, string> = {
  Education: "bg-cat-education",
  Health: "bg-cat-health",
  Housing: "bg-cat-housing",
  Utilities: "bg-cat-utilities",
};

/** Horizontal drag distance (px) needed to commit a swipe. */
const SWIPE_THRESHOLD = 110;
/** Duration of the card exit animation (ms). */
const EXIT_MS = 200;

const PRESET_AMOUNTS = [1000, 2500, 5000, 10000];

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

/** Bill photo with a token-based gradient fallback. */
function BillPhoto({ bill }: { bill: DeckBill }) {
  const [failed, setFailed] = useState(false);
  if (!bill.imageUrl || failed) {
    return (
      <div
        data-testid="bill-photo"
        role="img"
        aria-label={`${bill.title} photo`}
        className="bg-brand-gradient h-48 w-full sm:h-56"
      />
    );
  }
  return (
    <img
      data-testid="bill-photo"
      src={bill.imageUrl}
      alt={`${bill.title} photo`}
      draggable={false}
      onError={() => setFailed(true)}
      className="pointer-events-none h-48 w-full select-none object-cover sm:h-56"
    />
  );
}

/** Card body shared by the top card and the decorative card behind it. */
function CardBody({ bill, isTop }: { bill: DeckBill; isTop: boolean }) {
  return (
    <>
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 z-10 w-1.5 ${accentClass[bill.category] ?? "bg-primary"}`} />
      <BillPhoto bill={bill} />
      <div className="p-5 pl-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CategoryBadge category={bill.category} />
            <h2
              data-testid={isTop ? "deck-card-title" : undefined}
              className="mt-3 break-words text-xl font-semibold leading-snug"
            >
              {bill.title}
            </h2>
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
              <PinIcon />
              {bill.city}
            </p>
          </div>
          <span className="bg-brand-gradient shrink-0 rounded-full px-3 py-1 text-sm font-bold text-primary-foreground">
            {fundedPercent(bill.raised, bill.goal)}%
          </span>
        </div>
        <ProgressBar value={bill.raised} goal={bill.goal} className="mt-4" label={`${bill.title} funding progress`} />
        <dl className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">Raised</dt>
            <dd data-testid={isTop ? "bill-raised" : undefined} className="font-semibold text-foreground">
              {formatNaira(bill.raised)}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">Needed</dt>
            <dd data-testid={isTop ? "bill-needed" : undefined} className="font-semibold text-foreground">
              {formatNaira(bill.goal)}
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}

/** Modal for choosing a donation amount for the given bill. */
function GiveDialog({ bill, onClose }: { bill: DeckBill; onClose: () => void }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(PRESET_AMOUNTS[1]);
  const [custom, setCustom] = useState("");
  const firstRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const customAmount = toAmount(custom);
  const amount = custom.trim() ? customAmount : selected ?? 0;
  const valid = amount >= 100;

  const proceed = () => {
    if (!valid) return;
    onClose();
    void navigate({ to: "/bills/$id", params: { id: bill.id } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="give-dialog-title"
        className="glass shadow-elegant w-full max-w-md rounded-2xl p-6 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="give-dialog-title" className="font-display text-2xl font-semibold">
          Choose an amount
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your gift goes towards <span className="font-semibold text-foreground">{bill.title}</span>.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {PRESET_AMOUNTS.map((a, i) => {
            const active = !custom.trim() && selected === a;
            return (
              <button
                key={a}
                ref={i === 0 ? firstRef : undefined}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setSelected(a);
                  setCustom("");
                }}
                className={`rounded-xl border px-4 py-3 text-base font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary hover:text-primary"
                }`}
              >
                {formatNaira(a)}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-sm font-medium" htmlFor="give-custom-amount">
          Or enter your own amount (₦)
        </label>
        <input
          id="give-custom-amount"
          inputMode="numeric"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="e.g. 3000"
          className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {custom.trim() && !valid && <p className="mt-1 text-sm text-destructive">Minimum gift is {formatNaira(100)}.</p>}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={proceed}
            disabled={!valid}
            className="bg-brand-gradient flex-1 rounded-full px-4 py-2.5 text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-50"
          >
            Continue{valid ? ` · ${formatNaira(amount)}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function DiscoverPage() {
  const { bills } = useApprovedBills();
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [giving, setGiving] = useState<DeckBill | null>(null);

  const startX = useRef(0);
  const dxRef = useRef(0);
  const pointerId = useRef<number | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restart the deck when the data source changes (e.g. samples → live bills).
  useEffect(() => {
    setIndex(0);
    setDx(0);
    setExiting(false);
  }, [bills]);

  useEffect(
    () => () => {
      if (exitTimer.current) clearTimeout(exitTimer.current);
    },
    [],
  );

  const top = bills[index] ?? null;
  const next = bills[index + 1] ?? null;

  const skip = useCallback(() => {
    if (!top || exiting) return;
    setExiting(true);
    exitTimer.current = setTimeout(() => {
      setIndex((i) => i + 1);
      setExiting(false);
      setDx(0);
      dxRef.current = 0;
    }, EXIT_MS);
  }, [top, exiting]);

  const give = useCallback(() => {
    if (!top || exiting) return;
    setDx(0);
    dxRef.current = 0;
    setGiving(top);
  }, [top, exiting]);

  // Keyboard shortcuts: ← skip, → give (disabled while the dialog is open).
  useEffect(() => {
    if (giving) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") skip();
      else if (e.key === "ArrowRight") give();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [giving, skip, give]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (exiting || (e.pointerType === "mouse" && e.button !== 0)) return;
    if ((e.target as HTMLElement).closest("a,button")) return;
    pointerId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    dxRef.current = 0;
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || pointerId.current !== e.pointerId) return;
    const d = e.clientX - startX.current;
    dxRef.current = d;
    setDx(d);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging || pointerId.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    pointerId.current = null;
    setDragging(false);
    const d = dxRef.current;
    if (d <= -SWIPE_THRESHOLD) {
      skip();
    } else if (d >= SWIPE_THRESHOLD) {
      give();
    } else {
      setDx(0);
      dxRef.current = 0;
    }
  };

  const translate = exiting ? "-130%" : `${dx}px`;
  const rotate = exiting ? -14 : dx / 18;
  const cardStyle = {
    transform: `translateX(${translate}) rotate(${rotate}deg)`,
    opacity: exiting ? 0 : 1,
    transition: dragging ? "none" : `transform ${EXIT_MS}ms ease-out, opacity ${EXIT_MS}ms ease-out`,
    touchAction: "pan-y" as const,
  };

  const hint = dx <= -40 ? "Skip" : dx >= 40 ? "Give" : null;

  return (
    <main className="mx-auto max-w-xl px-4 py-14 sm:py-20">
      <section className="animate-fade-up">
        <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Verified · Real people</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Discover bills
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Swipe left to skip, or tap Give to help cover a verified bill.
        </p>
      </section>

      {top ? (
        <section aria-label="Bill deck" className="mt-10">
          <p className="mb-3 text-right text-xs font-medium text-muted-foreground" aria-live="polite">
            {index + 1} of {bills.length}
          </p>
          <div className="relative">
            {next && (
              <div
                aria-hidden="true"
                className="glass pointer-events-none absolute inset-0 translate-y-3 scale-[0.96] overflow-hidden rounded-2xl opacity-70"
              >
                <CardBody bill={next} isTop={false} />
              </div>
            )}
            <div
              key={top.id}
              data-testid="bill-card"
              aria-roledescription="swipeable card"
              className={`glass shadow-elegant relative cursor-grab select-none overflow-hidden rounded-2xl ${
                dragging ? "cursor-grabbing" : ""
              }`}
              style={cardStyle}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              {hint && (
                <span
                  aria-hidden="true"
                  className={`absolute top-4 z-20 rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide ${
                    hint === "Skip"
                      ? "right-4 bg-muted text-foreground"
                      : "bg-brand-gradient left-4 text-primary-foreground"
                  }`}
                >
                  {hint}
                </span>
              )}
              <CardBody bill={top} isTop />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={skip}
              disabled={exiting}
              className="glass rounded-full px-8 py-3 text-base font-semibold transition-colors hover:bg-muted disabled:opacity-60"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={give}
              disabled={exiting}
              className="bg-brand-gradient shadow-elegant rounded-full px-8 py-3 text-base font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              Give
            </button>
          </div>
          <p className="mt-3 text-center text-sm">
            <Link to="/bills/$id" params={{ id: top.id }} className="font-medium text-primary hover:underline">
              View details
            </Link>
          </p>
        </section>
      ) : (
        <section className="glass shadow-elegant mt-10 rounded-2xl p-8 text-center" aria-live="polite">
          <h2 className="font-display text-2xl font-semibold">You're all caught up</h2>
          <p className="mt-2 text-muted-foreground">You've seen every verified bill for now.</p>
          {bills.length > 0 && (
            <button
              type="button"
              onClick={() => setIndex(0)}
              className="bg-brand-gradient mt-5 rounded-full px-6 py-2.5 text-sm font-bold text-primary-foreground"
            >
              Start over
            </button>
          )}
        </section>
      )}

      <Link
        to="/"
        className="glass mt-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <span aria-hidden="true">←</span> Back home
      </Link>

      {giving && <GiveDialog bill={giving} onClose={() => setGiving(null)} />}
    </main>
  );
}
