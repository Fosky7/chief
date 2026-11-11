import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, ChevronRight, Check } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Chief · Help pay real bills for real people" },
      {
        name: "description",
        content:
          "Chief lets you discover verified bills — medical, school fees, rent — and give directly to the people who need it.",
      },
    ],
  }),
  component: HomePage,
});

const POINTS = [
  "Every bill is reviewed and verified before it appears",
  "Swipe through bills and give in seconds",
  "Payments go straight to the bill, not to a stranger's pocket",
];

function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Verified bills · Nigeria
          </span>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
            Help pay real bills for real people.
          </h1>
          <p className="text-lg text-muted-foreground">
            Chief connects givers with verified hospital bills, school fees and rent. Swipe through the deck, find a
            story that moves you, and give any amount from ₦1,000.
          </p>
          <ul className="space-y-2">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 text-green-600" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/discover"
              data-testid="home-discover-cta"
              className="inline-flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 font-semibold text-white shadow-lg hover:bg-green-600"
            >
              <Heart className="h-5 w-5" />
              Discover bills
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80"
            alt="Volunteers helping a community"
            className="h-80 w-full rounded-3xl object-cover shadow-xl"
          />
        </div>
      </section>
    </main>
  );
}
