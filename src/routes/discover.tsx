import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, X, Check } from "lucide-react";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover bills · Chief" },
      { name: "description", content: "Swipe through verified bills and give to the ones that move you." },
    ],
  }),
  component: DiscoverPage,
});

type DeckBill = {
  id: string;
  title: string;
  category: string;
  location: string;
  image: string;
  needed: number;
  raised: number;
};

const DECK: DeckBill[] = [
  {
    id: "deck-1",
    title: "Ada's kidney surgery at LUTH",
    category: "Medical",
    location: "Lagos",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80",
    needed: 1850000,
    raised: 742500,
  },
  {
    id: "deck-2",
    title: "Final-year school fees for Tunde",
    category: "Education",
    location: "Ibadan",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
    needed: 425000,
    raised: 310000,
  },
  {
    id: "deck-3",
    title: "Rent arrears for a widow of three",
    category: "Housing",
    location: "Abuja",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80",
    needed: 600000,
    raised: 128750,
  },
  {
    id: "deck-4",
    title: "Restock Mama Nkechi's provision shop",
    category: "Business",
    location: "Enugu",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=80",
    needed: 250000,
    raised: 96000,
  },
  {
    id: "deck-5",
    title: "Prenatal care for Blessing",
    category: "Medical",
    location: "Port Harcourt",
    image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=900&q=80",
    needed: 380000,
    raised: 215400,
  },
];

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const naira = (n: number) => `₦${nf.format(Math.round(n))}`;
const pct = (raised: number, needed: number) =>
  needed > 0 ? Math.min(100, Math.round((raised / needed) * 100)) : 0;

const AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];
const SWIPE_THRESHOLD = 100;

function DiscoverPage() {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [giveOpen, setGiveOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [pledged, setPledged] = useState<string | null>(null);
  const startX = useRef<number | null>(null);

  const bill = DECK[index];
  const next = DECK[index + 1];

  const skip = () => {
    setDragX(0);
    setPledged(null);
    setIndex((i) => i + 1);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    startX.current = e.clientX;
    setDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    setDragX(e.clientX - startX.current);
  };
  const onPointerUp = () => {
    if (startX.current === null) return;
    const dx = dragX;
    startX.current = null;
    setDragging(false);
    if (dx < -SWIPE_THRESHOLD) {
      skip();
    } else if (dx > SWIPE_THRESHOLD) {
      setDragX(0);
      setGiveOpen(true);
    } else {
      setDragX(0);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Discover bills</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Swipe left to skip, tap the heart to give.
      </p>

      {!bill ? (
        <div className="rounded-2xl border p-8 text-center">
          <p className="mb-4 font-semibold">You've seen every bill for now.</p>
          <button
            type="button"
            onClick={() => setIndex(0)}
            className="rounded-full bg-primary px-5 py-2 text-primary-foreground"
          >
            Start over
          </button>
        </div>
      ) : (
        <>
          <div className="relative h-[480px] select-none">
            {next && (
              <div className="absolute inset-0 scale-95 overflow-hidden rounded-2xl border bg-card opacity-60 shadow" aria-hidden="true">
                <img src={next.image} alt="" className="h-64 w-full object-cover" />
              </div>
            )}
            <div
              data-testid="swipe-card"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{
                transform: `translateX(${dragX}px) rotate(${dragX / 20}deg)`,
                transition: dragging ? "none" : "transform 200ms ease",
                touchAction: "none",
              }}
              className="absolute inset-0 cursor-grab overflow-hidden rounded-2xl border bg-card shadow-xl active:cursor-grabbing"
            >
              <img
                src={bill.image}
                alt={bill.title}
                draggable={false}
                className="pointer-events-none h-64 w-full object-cover"
              />
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{bill.category}</span>
                  <span className="text-muted-foreground">{bill.location}</span>
                </div>
                <h2 data-testid="bill-title" className="text-lg font-bold leading-tight">
                  {bill.title}
                </h2>
                <div className="flex justify-between text-sm">
                  <div>
                    <div className="text-muted-foreground">Needed</div>
                    <div data-testid="needed-amount" className="font-semibold">{naira(bill.needed)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Raised</div>
                    <div data-testid="raised-amount" className="font-semibold">{naira(bill.raised)}</div>
                  </div>
                </div>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct(bill.raised, bill.needed)}
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct(bill.raised, bill.needed)}%` }} />
                </div>
                <div className="text-xs text-muted-foreground">{pct(bill.raised, bill.needed)}% funded</div>
              </div>
            </div>
          </div>

          {pledged && <p className="mt-3 text-center text-sm text-green-600">{pledged}</p>}

          <div className="mt-6 flex items-center justify-center gap-8">
            <button
              type="button"
              aria-label="Skip"
              onClick={skip}
              className="flex h-16 w-16 flex-col items-center justify-center rounded-full border bg-background text-xs shadow hover:bg-muted"
            >
              <X className="h-6 w-6" />
              Skip
            </button>
            <button
              type="button"
              aria-label="Give"
              onClick={() => setGiveOpen(true)}
              className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-primary text-xs text-primary-foreground shadow hover:opacity-90"
            >
              <Heart className="h-6 w-6" />
              Give
            </button>
          </div>
        </>
      )}

      {giveOpen && bill && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setGiveOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="give-heading"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-2xl bg-background p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="give-heading" className="text-lg font-bold">Choose an amount</h2>
              <button type="button" aria-label="Close" onClick={() => setGiveOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">For: {bill.title}</p>
            <div className="grid grid-cols-3 gap-2">
              {AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${amount === a ? "border-primary bg-primary/10 text-primary" : ""}`}
                >
                  {naira(a)}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={amount === null}
              onClick={() => {
                if (amount === null) return;
                setPledged(`Thank you! ${naira(amount)} pledged to ${bill.title}.`);
                setGiveOpen(false);
                setAmount(null);
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Continue{amount !== null ? ` with ${naira(amount)}` : ""}
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <Link to="/" className="underline">Back to home</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
