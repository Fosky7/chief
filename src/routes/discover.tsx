import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { formatNaira } from "@/lib/currency";

type DiscoveryBill = {
  id: string;
  title: string;
  category: string;
  summary: string;
  amount: number;
  funded: number;
};

const DISCOVERY_BILLS: DiscoveryBill[] = [
  {
    id: "disc-education-001",
    title: "Community STEM Lab for Secondary Schools",
    category: "Education",
    summary:
      "Equip three public secondary schools with science kits, laptops and a shared laboratory space.",
    amount: 4500000,
    funded: 1800000,
  },
  {
    id: "disc-health-002",
    title: "Mobile Maternal Clinic for Rural Wards",
    category: "Health",
    summary:
      "A roving clinic bringing antenatal care and safe-delivery kits to four underserved wards.",
    amount: 8000000,
    funded: 5200000,
  },
  {
    id: "disc-infra-003",
    title: "Solar Borehole for Ijebu Community",
    category: "Infrastructure",
    summary:
      "A solar-powered borehole and storage tank delivering clean water to 900 residents.",
    amount: 6200000,
    funded: 900000,
  },
  {
    id: "disc-agri-004",
    title: "Youth Cassava Processing Cooperative",
    category: "Agriculture",
    summary:
      "Processing equipment and training for a 40-member youth cooperative in Ogun State.",
    amount: 3000000,
    funded: 1500000,
  },
];

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
});

function DiscoverPage() {
  const [index, setIndex] = useState(0);
  const [needed, setNeeded] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);

  const current = DISCOVERY_BILLS[index];

  const percent = useMemo(() => {
    if (!current || current.amount <= 0) return 0;
    return Math.min(100, Math.round((current.funded / current.amount) * 100));
  }, [current]);

  const remaining = current ? Math.max(0, current.amount - current.funded) : 0;

  function advance() {
    setIndex((prev) => Math.min(prev + 1, DISCOVERY_BILLS.length));
  }

  function handleNeeded() {
    if (!current) return;
    setNeeded((prev) => [...prev, current.id]);
    advance();
  }

  function handlePass() {
    if (!current) return;
    setPassed((prev) => [...prev, current.id]);
    advance();
  }

  function handleReset() {
    setIndex(0);
    setNeeded([]);
    setPassed([]);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Discover
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">
          What&apos;s Needed right now
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Swipe through community bills and mark the ones you want to back.
        </p>
      </header>

      {current ? (
        <article
          key={current.id}
          className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg"
          data-testid="discover-card"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              {current.category}
            </span>
            <span
              className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300"
              data-testid="needed-label"
            >
              Needed
            </span>
          </div>

          <h2 className="mt-4 text-lg font-semibold text-white">{current.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{current.summary}</p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{formatNaira(current.funded)} funded</span>
              <span>{percent}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${percent}%` }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-white" data-testid="needed-amount">
              Needed: {formatNaira(remaining)}
            </p>
            <p className="text-xs text-slate-500">Target: {formatNaira(current.amount)}</p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={handlePass}
              aria-label="Pass on this bill"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNeeded}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <Check className="h-4 w-4" />
              I&apos;m in
            </button>
          </div>
        </article>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center">
          <h2 className="text-lg font-semibold text-white">You&apos;re all caught up</h2>
          <p className="mt-2 text-sm text-slate-400">
            You marked {needed.length} bill{needed.length === 1 ? "" : "s"} as needed and passed
            on {passed.length}.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            Start over
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-500" data-testid="deck-position">
        Bill {Math.min(index + 1, DISCOVERY_BILLS.length)} of {DISCOVERY_BILLS.length}
      </p>
    </div>
  );
}
