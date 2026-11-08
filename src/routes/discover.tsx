import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { SwipeCard } from "@/components/SwipeCard";
import { useApprovedBills, type ApprovedBill } from "@/hooks/useApprovedBills";
import { formatNaira, remainingAmount, toAmount } from "@/lib/currency";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [{ title: "Discover bills — Chief" }],
  }),
  component: DiscoverPage,
});

/** Horizontal drag distance (px) needed to commit a swipe. */
const SWIPE_THRESHOLD = 110;
/** Duration of the fly-out animation before the next card shows. */
const EXIT_MS = 220;
const PRESET_AMOUNTS = [1000, 2500, 5000, 10000];
const MIN_GIFT = 100;
export const PENDING_GIFT_KEY = "chief:pendingGift";

type DragState = { x: number; y: number; active: boolean };
type ExitDir = "left" | null;

function DiscoverPage() {
  const { bills, loading } = useApprovedBills();
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState<DragState>({ x: 0, y: 0, active: false });
  const [exit, setExit] = useState<ExitDir>(null);
  const [giveOpen, setGiveOpen] = useState(false);

  const startRef = useRef<{ x: number; y: number; id: number } | null>(null);
  const exitTimer = useRef<number | null>(null);
  const giveButtonRef = useRef<HTMLButtonElement>(null);

  // Restart the deck when the underlying list changes (e.g. sample → live).
  useEffect(() => {
    setIndex(0);
  }, [bills]);

  useEffect(() => {
    return () => {
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
    };
  }, []);

  const count = bills.length;
  const position = count > 0 ? index % count : 0;
  const top: ApprovedBill | undefined = bills[position];
  // Up to two cards stacked behind the top card, for depth.
  const behind = count > 1 ? [1, 2].filter((o) => o < count).map((o) => bills[(position + o) % count]) : [];

  const skip = useCallback(() => {
    if (!top || exit) return;
    setExit("left");
    exitTimer.current = window.setTimeout(() => {
      setIndex((i) => i + 1);
      setExit(null);
      setDrag({ x: 0, y: 0, active: false });
      exitTimer.current = null;
    }, EXIT_MS);
  }, [top, exit]);

  const openGive = useCallback(() => {
    if (!top) return;
    setDrag({ x: 0, y: 0, active: false });
    setGiveOpen(true);
  }, [top]);

  const closeGive = useCallback(() => {
    setGiveOpen(false);
    // Return focus to the trigger for keyboard users.
    window.setTimeout(() => giveButtonRef.current?.focus(), 0);
  }, []);

  // ---- Drag handling (pointer events cover mouse, touch and pen) ----
  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (exit || giveOpen) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    setDrag({ x: 0, y: 0, active: true });
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const start = startRef.current;
    if (!start || start.id !== e.pointerId) return;
    setDrag({ x: e.clientX - start.x, y: (e.clientY - start.y) * 0.3, active: true });
  };

  const endDrag = (e: ReactPointerEvent<HTMLElement>, cancelled = false) => {
    const start = startRef.current;
    if (!start || start.id !== e.pointerId) return;
    startRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const dx = e.clientX - start.x;
    if (!cancelled && dx <= -SWIPE_THRESHOLD) {
      setDrag({ x: dx, y: 0, active: false });
      skip();
    } else if (!cancelled && dx >= SWIPE_THRESHOLD) {
      openGive();
    } else {
      setDrag({ x: 0, y: 0, active: false });
    }
  };

  const onDeckKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (giveOpen) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      skip();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      openGive();
    }
  };

  const transform = exit
    ? "translateX(-130%) rotate(-18deg)"
    : `translateX(${drag.x}px) translateY(${drag.y}px) rotate(${drag.x * 0.06}deg)`;
  const hint = drag.active ? (drag.x <= -SWIPE_THRESHOLD / 2 ? "skip" : drag.x >= SWIPE_THRESHOLD / 2 ? "give" : null) : null;

  return (
    <main className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <section className="animate-fade-up text-center">
        <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Verified · Real people</p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Discover bills
        </h1>
        <p className="mt-3 text-muted-foreground">Swipe left to skip, or tap Give to help pay a bill directly.</p>
      </section>

      {top ? (
        <>
          <div className="mt-8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span data-testid="deck-position">
              {position + 1} of {count}
            </span>
            <Link to="/bills/$id" params={{ id: top.id }} className="text-primary hover:underline">
              View full story →
            </Link>
          </div>

          <div
            role="region"
            aria-label="Bill deck. Use left arrow to skip and right arrow to give."
            aria-busy={loading}
            tabIndex={0}
            onKeyDown={onDeckKeyDown}
            className="relative mt-3 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* Background cards (visual only) */}
            {behind
              .slice()
              .reverse()
              .map((b, i, arr) => {
                const depth = arr.length - i; // 2 = furthest
                return (
                  <SwipeCard
                    key={`${b.id}-behind-${depth}`}
                    bill={b}
                    className="pointer-events-none absolute inset-x-0 top-0 transition-transform duration-200"
                    style={{ transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`, opacity: 1 - depth * 0.25 }}
                  />
                );
              })}

            <div aria-live="polite" className="sr-only">
              Now showing {top.title}
            </div>

            <SwipeCard
              key={`${top.id}-${index}`}
              bill={top}
              isTop
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={(e) => endDrag(e)}
              onPointerCancel={(e) => endDrag(e, true)}
              className={`relative z-10 cursor-grab touch-pan-y active:cursor-grabbing ${
                drag.active ? "" : "transition-transform duration-200 ease-out motion-reduce:transition-none"
              }`}
              style={{ transform, opacity: exit ? 0 : 1 }}
            />

            {hint && (
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute top-6 z-20 rounded-xl border-2 px-3 py-1 text-lg font-bold uppercase tracking-wider ${
                  hint === "skip"
                    ? "right-6 rotate-12 border-muted-foreground bg-card/80 text-muted-foreground"
                    : "left-6 -rotate-12 border-primary bg-card/80 text-primary"
                }`}
              >
                {hint === "skip" ? "Skip" : "Give"}
              </span>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={skip}
              disabled={!!exit}
              className="glass rounded-full px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              Skip
            </button>
            <button
              ref={giveButtonRef}
              type="button"
              onClick={openGive}
              className="bg-brand-gradient shadow-elegant rounded-full px-6 py-3 text-base font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Give
            </button>
          </div>
        </>
      ) : (
        <div className="glass mt-10 rounded-3xl p-8 text-center">
          <p className="font-semibold">{loading ? "Loading bills…" : "No bills need help right now."}</p>
          <p className="mt-2 text-sm text-muted-foreground">Check back soon — new verified bills arrive daily.</p>
        </div>
      )}

      <Link
        to="/"
        className="glass mt-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
      >
        <span aria-hidden="true">←</span> Back home
      </Link>

      {giveOpen && top && <AmountChooser bill={top} onClose={closeGive} />}
    </main>
  );
}

/** Modal dialog that lets a donor pick a preset or custom gift amount. */
function AmountChooser({ bill, onClose }: { bill: ApprovedBill; onClose: () => void }) {
  const navigate = useNavigate();
  const titleId = useId();
  const inputId = useId();
  const firstRef = useRef<HTMLButtonElement>(null);
  const maxGift = Math.max(remainingAmount(bill.raised, bill.goal), MIN_GIFT);
  const defaultPreset = PRESET_AMOUNTS.find((a) => a <= maxGift) ?? null;
  const [selected, setSelected] = useState<number | null>(defaultPreset);
  const [custom, setCustom] = useState("");

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const amount = custom.trim() ? Math.round(toAmount(custom)) : selected ?? 0;
  const error =
    custom.trim() && amount < MIN_GIFT
      ? `Minimum gift is ${formatNaira(MIN_GIFT)}`
      : amount > maxGift
        ? `This bill only needs ${formatNaira(maxGift)} more`
        : null;
  const valid = amount >= MIN_GIFT && amount <= maxGift && !error;

  const proceed = () => {
    if (!valid) return;
    try {
      sessionStorage.setItem(PENDING_GIFT_KEY, JSON.stringify({ billId: bill.id, amount }));
    } catch {
      // Storage may be unavailable (private mode); the bill page still works.
    }
    void navigate({ to: "/bills/$id", params: { id: bill.id } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-fade-up shadow-elegant relative w-full max-w-sm rounded-3xl bg-card p-6"
      >
        <h2 id={titleId} className="font-display text-2xl font-semibold">
          Choose an amount
        </h2>
        <p className="mt-1 break-words text-sm text-muted-foreground">
          For <span className="font-semibold text-foreground">{bill.title}</span> · {formatNaira(maxGift)} still needed
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3" role="group" aria-label="Preset amounts">
          {PRESET_AMOUNTS.map((a, i) => {
            const active = !custom.trim() && selected === a;
            return (
              <button
                key={a}
                ref={i === 0 ? firstRef : undefined}
                type="button"
                aria-pressed={active}
                disabled={a > maxGift}
                onClick={() => {
                  setSelected(a);
                  setCustom("");
                }}
                className={`rounded-2xl border px-4 py-3 text-base font-semibold transition-colors disabled:opacity-40 ${
                  active ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted"
                }`}
              >
                {formatNaira(a)}
              </button>
            );
          })}
        </div>

        <label htmlFor={inputId} className="mt-5 block text-sm font-semibold">
          Custom amount (₦)
        </label>
        <input
          id={inputId}
          inputMode="numeric"
          placeholder="e.g. 7500"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
          aria-invalid={!!error}
          className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-full border border-border px-4 py-3 font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            type="button"
            onClick={proceed}
            disabled={!valid}
            className="bg-brand-gradient flex-1 rounded-full px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50"
          >
            {valid ? `Continue · ${formatNaira(amount)}` : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
