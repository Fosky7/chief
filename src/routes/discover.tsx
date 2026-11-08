import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useApprovedBills } from "@/hooks/useApprovedBills";
import { SwipeCard } from "@/components/SwipeCard";
import { formatNaira } from "@/lib/currency";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover bills" }] }),
  component: DiscoverPage,
});

const AMOUNTS = [1000, 5000, 10000, 25000];

function DiscoverPage() {
  const { bills } = useApprovedBills();
  const [index, setIndex] = React.useState(0);
  const [giveOpen, setGiveOpen] = React.useState(false);
  const [chosen, setChosen] = React.useState<number | null>(null);

  const bill = bills.length ? bills[index % bills.length] : null;
  const next = () => setIndex((i) => i + 1);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-2xl font-bold">Discover bills</h1>
      {bill ? (
        <SwipeCard key={`${bill.id}-${index}`} bill={bill} onSwipeLeft={next} />
      ) : (
        <p>No bills right now.</p>
      )}
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={next} className="flex-1 rounded-lg border px-4 py-2">
          Skip
        </button>
        <button
          type="button"
          onClick={() => setGiveOpen(true)}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white"
        >
          Give
        </button>
      </div>
      {giveOpen && (
        <div role="dialog" aria-label="Choose an amount" className="fixed inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-2xl">
          <h2 className="mb-3 text-lg font-semibold">Choose an amount</h2>
          <div className="grid grid-cols-2 gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setChosen(a)}
                className={`rounded-lg border px-3 py-2 ${chosen === a ? "border-emerald-600 bg-emerald-50" : ""}`}
              >
                {formatNaira(a)}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setGiveOpen(false)} className="mt-3 w-full rounded-lg border px-4 py-2">
            Close
          </button>
        </div>
      )}
    </main>
  );
}
