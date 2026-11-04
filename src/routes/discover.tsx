import { createFileRoute, Link } from "@tanstack/react-router";
import { formatNaira, fundedPercent } from "@/lib/currency";

export const Route = createFileRoute("/discover")({
  component: DiscoverPage,
});

const bills = [
  { title: "Ada's final-year school fees", city: "Enugu", raised: 185000, goal: 250000 },
  { title: "Baba Tunde's hospital bill", city: "Ibadan", raised: 420000, goal: 600000 },
  { title: "Rent for a single mum of three", city: "Lagos", raised: 90000, goal: 350000 },
  { title: "Prepaid electricity for a clinic", city: "Kano", raised: 40000, goal: 120000 },
];

function DiscoverPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Discover bills</h1>
      <p className="mt-2 text-muted-foreground">Verified bills from people who need a hand right now.</p>
      <ul className="mt-8 space-y-4">
        {bills.map((b) => (
          <li key={b.title} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{b.title}</h2>
                <p className="text-sm text-muted-foreground">{b.city}</p>
              </div>
              <span className="text-sm font-semibold">{fundedPercent(b.raised, b.goal)}%</span>
            </div>
            <p className="mt-3 text-sm">
              {formatNaira(b.raised)} raised of {formatNaira(b.goal)}
            </p>
          </li>
        ))}
      </ul>
      <Link to="/" className="mt-8 inline-block text-sm font-semibold text-primary hover:underline">
        ← Back home
      </Link>
    </div>
  );
}
