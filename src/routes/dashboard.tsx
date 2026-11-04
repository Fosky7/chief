import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {!ready ? (
        <p className="mt-4 text-muted-foreground">Loading…</p>
      ) : email ? (
        <p className="mt-4 text-muted-foreground">Signed in as {email}. Your bills and donations will appear here.</p>
      ) : (
        <p className="mt-4 text-muted-foreground">
          You're not signed in.{" "}
          <Link to="/sign-in" className="font-semibold text-primary hover:underline">
            Sign in to continue
          </Link>
        </p>
      )}
    </div>
  );
}
