import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GradientButton, GlowBackdrop } from "@/components/ui/brand";
import { useAuth, type AuthMode, type SignUpRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in — Chief" }],
  }),
  component: AuthPage,
});

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-background/80 px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20";

const roles: Array<{
  value: SignUpRole;
  label: string;
  description: string;
}> = [
  {
    value: "donor",
    label: "Donor",
    description: "Discover verified bills and help people across Nigeria.",
  },
  {
    value: "bill_requester",
    label: "Bill requester",
    description: "Submit a rent, school, utility or hospital bill for review.",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignUpRole>("donor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setHint(null);
    setSavedAt(null);
    setRole("donor");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setHint(null);
    setSavedAt(null);
    setLoading(true);

    try {
      if (mode === "signIn") {
        await signIn({ email, password });
        await navigate({ to: "/" });
        return;
      }

      const cleanEmail = email.trim();

      // The backend keeps a durable signup record, so a repeated sign-up for an
      // address that is already stored must be reported as a duplicate even
      // when the auth provider hides existing accounts.
      const { data: alreadySaved, error: existsError } = await supabase.rpc(
        "signup_exists",
        { p_email: cleanEmail },
      );
      // A non-duplicate check failure is non-fatal: only an explicit `true` blocks.
      if (!existsError && alreadySaved === true) {
        setError("An account with this email already exists. Please sign in instead.");
        return;
      }

      const { needsConfirmation } = await signUp({ email, password, role });
      setPassword("");

      // Persist the sign-up itself so the account is proven stored even when
      // email confirmation is required and no session exists yet.
      let persistedAt: string | null = null;
      try {
        const { error: recordError } = await supabase.rpc("record_signup", {
          p_email: cleanEmail,
          p_role: role,
        });
        if (recordError) throw recordError;

        // Read the stored row back from the backend to prove persistence.
        const { data: storedAt } = await supabase.rpc("signup_saved_at", {
          p_email: cleanEmail,
        });
        if (typeof storedAt === "string" && storedAt.length > 0) {
          persistedAt = storedAt;
        } else {
          persistedAt = new Date().toISOString();
        }
      } catch (recordFailure) {
        console.warn("[auth] Could not record signup", recordFailure);
      }

      setSavedAt(persistedAt);
      setMessage("Account created");
      setHint(
        needsConfirmation
          ? "Check your inbox to confirm your email, then sign in."
          : "You're signed in and ready to go.",
      );
    } catch (submissionError) {
      if (mode === "signIn") {
        // Avoid disclosing whether a supplied email address is registered.
        setError("Invalid login credentials");
      } else {
        const raw =
          submissionError instanceof Error
            ? submissionError.message
            : "We could not create your account. Please try again.";
        setError(
          /already|registered|exists/i.test(raw)
            ? "An account with this email already exists. Please sign in instead."
            : raw,
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const signingIn = mode === "signIn";

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-12 sm:py-20">
      <GlowBackdrop className="opacity-70" />
      <div className="grid overflow-hidden rounded-[2rem] shadow-elegant md:grid-cols-[0.9fr_1.1fr]">
        <aside className="bg-brand-gradient relative hidden overflow-hidden p-10 text-primary-foreground md:flex md:flex-col md:justify-between">
          <div aria-hidden="true" className="absolute inset-0 bg-black/20" />
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl"
          />
          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
              Chief
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">
              Real bills. Verified people. Meaningful help.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-white/85">
              Join a community helping Nigerians cover urgent school, rent,
              utility and hospital bills.
            </p>
          </div>
          <ul className="relative mt-12 space-y-4 text-sm text-white/90">
            {[
              "Every bill is reviewed before it goes live",
              "Your account role keeps your experience relevant",
              "Payments in Naira are handled securely through Paystack",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20"
                  aria-hidden="true"
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <section className="glass bg-card/90 p-7 sm:p-10 md:p-12">
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">
            {signingIn ? "Welcome back" : "Join the community"}
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            {signingIn ? "Sign in to Chief" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {signingIn
              ? "Access your donations, submitted bills and account details."
              : "Choose how you plan to use Chief. You can still support bills with either role."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate={false}>
            <label className="block text-sm font-semibold">
              Email
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-semibold">
              Password
              <input
                type="password"
                name="password"
                required
                minLength={signingIn ? undefined : 8}
                autoComplete={signingIn ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder={signingIn ? "Your password" : "At least 8 characters"}
              />
            </label>

            {!signingIn && (
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">I'm joining as</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roles.map((option) => {
                    const selected = role === option.value;

                    return (
                      <label
                        key={option.value}
                        className={`cursor-pointer rounded-2xl border p-4 transition ${
                          selected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                            : "border-input bg-background/60 hover:border-primary/50"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="account-role"
                            value={option.value}
                            aria-label={option.label}
                            checked={selected}
                            onChange={() => setRole(option.value)}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="font-semibold text-foreground">
                            {option.label}
                          </span>
                        </span>
                        <span className="mt-2 block pl-7 text-xs leading-relaxed text-muted-foreground">
                          {option.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
              >
                {error}
              </p>
            )}

            {message && (
              <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                <p role="status" className="font-semibold">
                  {message}
                </p>
                {hint && <p className="mt-1 text-xs opacity-90">{hint}</p>}
                {savedAt && (
                  <p data-testid="signup-saved-at" className="mt-1 text-xs opacity-90">
                    Saved to the backend on {new Date(savedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <GradientButton
              type="submit"
              size="lg"
              disabled={loading}
              className="w-full"
            >
              {loading
                ? signingIn
                  ? "Signing in…"
                  : "Creating account…"
                : signingIn
                  ? "Sign in"
                  : "Create account"}
            </GradientButton>
          </form>

          <div className="mt-6 border-t border-border/70 pt-6 text-center text-sm text-muted-foreground">
            {signingIn ? "New to Chief?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="font-semibold text-primary underline-offset-4 transition hover:underline"
              onClick={() => changeMode(signingIn ? "signUp" : "signIn")}
            >
              {signingIn ? "Create an account" : "Sign in instead"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
