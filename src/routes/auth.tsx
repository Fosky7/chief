import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { GradientButton } from "@/components/ui/brand";
import { ROLE_LABELS, type SignupRole } from "@/types";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "signin" | "signup";

const INVALID_CREDENTIALS = "Invalid login credentials";

function toMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(err);
}

// Normalise sign-in failures so a wrong email/password always reads "Invalid login credentials".
function normalizeSignInError(err: unknown): string {
  const msg = toMessage(err);
  if (/not\s*confirmed|confirm/i.test(msg)) return msg;
  if (!msg || /invalid|credential|password|incorrect|wrong|not\s*found|400/i.test(msg)) {
    return INVALID_CREDENTIALS;
  }
  return msg;
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-background/70 px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20";

const roleOptions: Array<{ value: SignupRole; label: string; description: string; icon: string }> = [
  { value: "donor", label: "Donor", description: "Swipe through verified bills and chip in any amount.", icon: "♥" },
  {
    value: "requester",
    label: "Bill requester",
    description: "Post a rent, school or hospital bill for our team to review.",
    icon: "₦",
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading, signIn, signUp, signOut } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupRole, setSignupRole] = useState<SignupRole>("donor");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ role: SignupRole; needsConfirmation: boolean; email: string } | null>(null);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signin") {
        let res: { error?: unknown } | undefined;
        try {
          res = (await signIn(email, password)) as { error?: unknown } | undefined;
        } catch (err) {
          setError(normalizeSignInError(err));
          return;
        }
        if (res?.error) {
          setError(normalizeSignInError(res.error));
          return;
        }
        navigate({ to: "/" });
      } else {
        const res = await signUp({ email, password, role: signupRole, fullName });
        if (res.error) {
          setError(toMessage(res.error));
          return;
        }
        setCreated({ role: signupRole, needsConfirmation: res.needsConfirmation, email: email.trim() });
        setPassword("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="grid overflow-hidden rounded-3xl md:grid-cols-2 md:shadow-elegant">
        <BrandPanel />

        <section className="glass shadow-elegant rounded-3xl p-8 sm:p-10 md:rounded-none md:shadow-none">
          {created ? (
            <div className="animate-fade-up" role="status">
              <span
                aria-hidden="true"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-2xl text-success"
              >
                ✓
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">Account created</h1>
              <p className="mt-3 text-muted-foreground">
                Welcome to Chief! You joined as a <strong className="text-foreground">{ROLE_LABELS[created.role]}</strong>.
              </p>
              {created.needsConfirmation ? (
                <p className="mt-2 break-words text-sm text-muted-foreground">
                  We sent a confirmation link to <span className="font-semibold text-foreground">{created.email}</span>. Confirm
                  your email, then sign in.
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">You're signed in and ready to go.</p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                {created.needsConfirmation ? (
                  <GradientButton
                    type="button"
                    size="lg"
                    onClick={() => {
                      setCreated(null);
                      switchMode("signin");
                    }}
                  >
                    Go to sign in
                  </GradientButton>
                ) : (
                  <GradientButton to={created.role === "donor" ? "/discover" : "/dashboard"} size="lg">
                    {created.role === "donor" ? "Start swiping" : "Go to dashboard"}
                  </GradientButton>
                )}
              </div>
            </div>
          ) : !authLoading && user ? (
            <div className="animate-fade-up">
              <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">You're in</p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Signed in</h1>
              <p className="mt-3 break-words text-muted-foreground">
                Signed in as <span className="font-semibold text-foreground">{user.email}</span>
                {role ? ` · ${ROLE_LABELS[role]}` : ""}.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <GradientButton to="/discover" size="lg">
                  Discover bills
                </GradientButton>
                <GradientButton type="button" variant="ghost" size="lg" onClick={() => void signOut()}>
                  Sign out
                </GradientButton>
              </div>
            </div>
          ) : (
            <>
              <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">
                {mode === "signin" ? "Welcome back" : "Join Chief"}
              </p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
                {mode === "signin" ? "Sign in to Chief" : "Create your account"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Sign in to post a bill or track your donations."
                  : "Choose how you'll use Chief. You can give and ask for help in Naira."}
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate={false}>
                {mode === "signup" && (
                  <fieldset>
                    <legend className="text-sm font-semibold">I'm joining as</legend>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {roleOptions.map((opt) => {
                        const selected = signupRole === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={`relative flex cursor-pointer flex-col rounded-2xl border p-4 transition ${
                              selected
                                ? "border-primary bg-primary/10 ring-4 ring-primary/15"
                                : "border-input bg-background/60 hover:border-primary/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={opt.value}
                              aria-label={opt.label}
                              checked={selected}
                              onChange={() => setSignupRole(opt.value)}
                              className="sr-only"
                            />
                            <span className="flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                className="bg-brand-gradient inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                              >
                                {opt.icon}
                              </span>
                              <span className="font-semibold text-foreground">{opt.label}</span>
                            </span>
                            <span aria-hidden="true" className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {opt.description}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {mode === "signup" && (
                  <label className="block text-sm font-semibold">
                    Full name <span className="font-normal text-muted-foreground">(optional)</span>
                    <input
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                )}

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
                    minLength={mode === "signup" ? 6 : undefined}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
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

                <GradientButton type="submit" disabled={submitting} size="lg" className="w-full">
                  {mode === "signin"
                    ? submitting
                      ? "Signing in…"
                      : "Sign in"
                    : submitting
                      ? "Creating account…"
                      : "Create account"}
                </GradientButton>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New to Chief?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {mode === "signin" ? "Create an account" : "Back to sign in"}
                </button>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="bg-brand-gradient relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground md:flex">
      <div aria-hidden="true" className="absolute inset-0 bg-foreground/25" />
      <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-foreground/15 blur-3xl" />
      <span
        aria-hidden="true"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-foreground/20 font-display text-xl font-bold ring-1 ring-primary-foreground/40"
      >
        C
      </span>
      <figure className="relative mt-12">
        <blockquote className="font-display text-2xl font-medium leading-snug">
          “I swiped right on a stranger's school fees during my lunch break. Two days later it was fully paid.”
        </blockquote>
        <figcaption className="mt-4 text-sm font-medium opacity-90">— Kunle, donor in Lagos</figcaption>
      </figure>
      <ul className="relative mt-10 space-y-3 text-sm">
        {[
          "Every bill is reviewed before it goes live",
          "Payments go straight to the hospital, school or landlord",
          "Amounts shown in Naira, always",
        ].map((t) => (
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
  );
}
