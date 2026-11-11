import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, X, ChevronRight } from "lucide-react";
import { sampleBills } from "@/lib/sampleBills";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover bills — swipe to back" },
      { name: "description", content: "Swipe through community bills and back the ones you care about." },
    ],
  }),
  component: DiscoverPage,
});

type DeckCard = {
  id: string;
  title: string;
  category: string;
  description: string;
  goal: number;
  raised: number;
};

const FALLBACK: DeckCard[] = [
  { id: "fallback-1", title: "Community water borehole", category: "Utilities", description: "Clean water for 300 households.", goal: 500000, raised: 210000 },
  { id: "fallback-2", title: "School fees support", category: "Education", description: "Term fees for a final-year student.", goal: 150000, raised: 90000 },
  { id: "fallback-3", title: "Clinic medication bill", category: "Health", description: "Essential medication for a recovering patient.", goal: 80000, raised: 20000 },
];

function pickString(obj: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
    if (typeof v === "number") return String(v);
  }
  return fallback;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function toDeck(): DeckCard[] {
  const raw = Array.isArray(sampleBills) ? (sampleBills as unknown as Array<Record<string, unknown>>) : [];
  const cards = raw
    .filter((b) => b && typeof b === "object")
    .map((b, i) => ({
      id: pickString(b, ["id", "slug"], `bill-${i}`),
      title: pickString(b, ["title", "name"], `Bill ${i + 1}`),
      category: pickString(b, ["category", "type"], "General"),
      description: pickString(b, ["description", "summary", "story"], ""),
      goal: pickNumber(b, ["goal", "target", "amount", "goalAmount", "targetAmount"]),
      raised: pickNumber(b, ["raised", "funded", "amountRaised", "raisedAmount"]),
    }));
  return cards.length > 0 ? cards : FALLBACK;
}

function naira(n: number): string {
  return `₦${Math.round(n).toLocaleString("en-NG")}`;
}

function DiscoverPage() {
  const deck = useMemo(() => toDeck(), []);
  const [index, setIndex] = useState(0);
  const [backed, setBacked] = useState<DeckCard[]>([]);
  const [passed, setPassed] = useState(0);
  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);

  const current = deck[index];
  const done = index >= deck.length;

  const decide = useCallback(
    (like: boolean) => {
      if (!current) return;
      if (like) setBacked((prev) => [...prev, current]);
      else setPassed((p) => p + 1);
      setIndex((i) => i + 1);
      setDragX(0);
    },
    [current],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") decide(false);
      if (e.key === "ArrowRight") decide(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current !== null) setDragX(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    startX.current = null;
    if (dragX > 100) decide(true);
    else if (dragX < -100) decide(false);
    else setDragX(0);
  };

  const restart = () => {
    setIndex(0);
    setBacked([]);
    setPassed(0);
    setDragX(0);
  };

  const pct = current && current.goal > 0 ? Math.min(100, Math.round((current.raised / current.goal) * 100)) : 0;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-3xl font-bold">Discover bills</h1>
      <p className="mt-1 text-sm opacity-70">Swipe right (or tap Back) to support a bill, swipe left to pass.</p>

      {!done && current ? (
        <section className="mt-6" aria-label="Swipe deck">
          <p data-testid="deck-counter" className="mb-2 text-sm opacity-70">
            {index + 1} of {deck.length}
          </p>
          <article
            data-testid="swipe-card"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            style={{ transform: `translateX(${dragX}px) rotate(${dragX / 20}deg)`, touchAction: "pan-y" }}
            className="select-none rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg transition-transform"
          >
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs">{current.category}</span>
            <h2 data-testid="swipe-card-title" className="mt-3 text-xl font-semibold">
              {current.title}
            </h2>
            {current.description && <p className="mt-2 text-sm opacity-80">{current.description}</p>}
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm">
              {naira(current.raised)} raised of {naira(current.goal)} ({pct}%)
            </p>
          </article>
          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => decide(false)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2"
            >
              <X className="h-4 w-4" /> Pass
            </button>
            <button
              type="button"
              onClick={() => decide(true)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-white"
            >
              <Check className="h-4 w-4" /> Back this bill
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl border border-white/10 p-6 text-center">
          <h2 className="text-xl font-semibold">You've seen every bill</h2>
          <p className="mt-2 text-sm opacity-70">
            You backed {backed.length} and passed {passed}.
          </p>
          <button type="button" onClick={restart} className="mt-4 rounded-full border border-white/20 px-5 py-2">
            Start over
          </button>
        </section>
      )}

      <section className="mt-8">
        <h2 data-testid="backed-heading" className="text-lg font-semibold">
          Backed ({backed.length})
        </h2>
        <ul className="mt-2 space-y-1 text-sm">
          {backed.map((b, i) => (
            <li key={`${b.id}-${i}`} data-testid="backed-item">
              {b.title}
            </li>
          ))}
        </ul>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-sm underline">
          Back home <ChevronRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
