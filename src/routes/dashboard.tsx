import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { formatNaira } from "@/lib/currency";
import { GradientButton, StatCard } from "@/components/ui/brand";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const shimmer =
  "animate-shimmer bg-[length:200%_100%] rounded-2xl bg-[linear-gradient(90deg,hsl(var(--muted))_0%,hsl(var(--card))_50%,hsl(var(--muted))_100%)]";

function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
  }, []);

  const initial = email ? email.charAt(0).toUpperCase() : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:py-20">
      <div className="flex items-center gap-4">
        {ready && email && (
          <span
            aria-hidden="true"
            className="bg-brand-gradient shadow-elegant inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-2xl font-bold text-primary-foreground"
          >
            {initial}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">
            {ready && email ? "Welcome back" : "Your space"}
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">Dashboard</h1>
        </div>
      </div>

      {!ready ? (
        <div className="mt-8" aria-busy="true">
          <p className="sr-only">Loading…</p>
          <div aria-hidden="true" className={`h-5 w-2/3 ${shimmer}`} />
          <div aria-hidden="true" className="mt-6 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`h-28 ${shimmer}`} />
            ))}
          </div>
        </div>
      ) : email ? (
        <>
          <p className="mt-4 break-words text-muted-foreground">
            Signed in as {email}. Your bills and donations will appear here.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard value={formatNaira(0)} label="Donated" className="animate-fade-up bg-brand-violet/10" />
            <StatCard
              value={0}
              label="Bills supported"
              className="animate-fade-up bg-brand-coral/10"
            />
            <StatCard value={0} label="Bills posted" className="animate-fade-up bg-brand-saffron/15" />
          </div>
        </>
      ) : (
        <div className="glass shadow-elegant relative mt-8 overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12">
          <div
            aria-hidden="true"
            className="bg-brand-gradient animate-float mx-auto h-24 w-24 rounded-[40%_60%_55%_45%/50%_45%_55%_50%] opacity-80 blur-[2px]"
          />
          <p className="mt-6 text-muted-foreground">You're not signed in.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to see the bills you've supported and the ones you've posted.
          </p>
          <GradientButton to="/sign-in" size="lg" className="mt-6">
            Sign in to continue
          </GradientButton>
        </div>
      )}
    </div>
  );
}
