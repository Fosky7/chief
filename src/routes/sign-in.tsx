import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { GradientButton } from "@/components/ui/brand";

// Canonical sign-in page (/sign-in), registered in src/routeTree.gen.ts.
export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});

const trustPoints = [
  "Every bill is reviewed before it goes live",
  "Payments go straight to the hospital, school or landlord",
  "Amounts shown in Naira, always",
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-background/70 px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20";

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="grid overflow-hidden rounded-3xl md:grid-cols-2 md:shadow-elegant">
        {/* Brand panel (desktop only) */}
        <aside className="bg-brand-gradient relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground md:flex">
          <div aria-hidden="true" className="absolute inset-0 bg-foreground/25" />
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-foreground/15 blur-3xl" />
          <div className="relative">
            <span
              aria-hidden="true"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-foreground/20 font-display text-xl font-bold ring-1 ring-primary-foreground/40"
            >
              C
            </span>
          </div>
          <figure className="relative mt-12">
            <blockquote className="font-display text-2xl font-medium leading-snug">
              “Someone paid my son's hospital bill on a Tuesday afternoon. I never met them, but I'll never forget them.”
            </blockquote>
            <figcaption className="mt-4 text-sm font-medium opacity-90">— Mama Chidi, Enugu</figcaption>
          </figure>
          <ul className="relative mt-10 space-y-3 text-sm">
            {trustPoints.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/25 text-xs font-bold"
                >
                  ✓
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Form card */}
        <section className="glass shadow-elegant rounded-3xl p-8 sm:p-10 md:rounded-none md:shadow-none">
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Welcome back</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to post a bill or track your donations.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm font-semibold">
              Password
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <GradientButton type="submit" disabled={loading} size="lg" className="w-full">
              {loading ? "Signing in…" : "Continue"}
            </GradientButton>
          </form>
        </section>
      </div>
    </div>
  );
}
