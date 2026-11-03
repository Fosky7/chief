import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { cx } from "@/config/containment";
import { buttons, layout, surfaces, typography } from "@/config/theme";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Chief" },
      { name: "description", content: "Sign in to Chief so your pledges, swipe progress and settings follow you to every device." },
    ],
  }),
  component: AuthPage,
});

const inputClass =
  "w-full rounded-2xl border border-input bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!isSupabaseConfigured) {
      setError("Sign-in isn't available right now. Please try again later.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice("Check your email and tap the link to confirm your account, then sign in here.");
          setMode("signin");
          return;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      }
      // Full load so every store reads the donor's saved data back.
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <section className={cx(layout.container, "py-12 sm:py-16")}>
        <div className={cx(surfaces.card, "mx-auto w-full max-w-md p-6 sm:p-8")}>
          <p className={typography.eyebrow}>Your Chief account</p>
          <h1 className={cx(typography.heading, "mt-2")}>
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
          <p className={cx(typography.body, "mt-2")}>
            Keep your pledges, swipe progress and settings on every device.
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              Email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              Password
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>

            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            {notice ? <p role="status" className="text-sm text-foreground">{notice}</p> : null}

            <button type="submit" disabled={busy} className={buttons.primary}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className={cx(typography.caption, "mt-5 text-center text-sm")}>
            {mode === "signin" ? "New to Chief? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className={cx(typography.caption, "mt-2 text-center")}>
            You can keep using Chief without an account — <Link to="/discover" className="text-primary">start swiping</Link>.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
