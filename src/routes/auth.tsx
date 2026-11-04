import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { GradientButton } from "@/components/ui/brand";
import { ROLE_LABELS, type SignupRole } from "@/types";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "signin" | "signup";

type CreatedAccount = {
  role: SignupRole;
  needsConfirmation: boolean;
  email: string;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-input bg-background/70 px-4 py-2.5 text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

const roleOptions: Array<{
  value: SignupRole;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    value: "donor",
    label: "Donor",
    description: "Swipe through verified bills and chip in any amount.",
    icon: "♥",
  },
  {
    value: "requester",
    label: "Bill requester",
    description: "Create an account to request help with a bill after review.",
    icon: "₦",
  },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading, signIn, signUp, signOut } = useAuth();

  const submissionLock = useRef(false);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupRole, setSignupRole] = useState<SignupRole>("donor");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [created, setCreated] = useState<CreatedAccount | null>(null);

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setPassword("");
  }

  function showSignIn() {
    setCreated(null);
    switchMode("signin");
  }

  function validateForm(): { email: string } | null {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Email is required.");
      return null;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setError("Enter a valid email address.");
      return null;
    }

    if (!password) {
      setError("Password is required.");
      return null;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return null;
    }

    return { email: normalizedEmail };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // State updates are asynchronous, so this ref prevents two rapid submit
    // events from issuing parallel authentication requests.
    if (submissionLock.current) return;

    setError(null);
    const validated = validateForm();
    if (!validated) return;

    submissionLock.current = true;
    setSubmitting(true);

    try {
      if (mode === "signin") {
        const result = await signIn(validated.email, password);
        if (result.error) {
          setError(result.error);
          return;
        }

        await navigate({ to: "/" });
        return;
      }

      const result = await signUp({
        email: validated.email,
        password,
        role: signupRole,
        fullName,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setCreated({
        role: signupRole,
        needsConfirmation: result.needsConfirmation,
        email: validated.email,
      });
      setPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      submissionLock.current = false;
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    setError(null);

    try {
      await signOut();
    } catch {
      setError("We couldn't sign you out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  const signedInRole = role ?? created?.role ?? null;
  const signedInDestination = signedInRole === "requester" ? "/dashboard" : "/discover";
  const signedInDestinationLabel = signedInRole === "requester" ? "Go to dashboard" : "Start swiping";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      <div className="grid overflow-hidden rounded-3xl md:grid-cols-2 md:shadow-elegant">
        <BrandPanel />

        <section className="glass rounded-3xl p-8 shadow-elegant sm:p-10 md:rounded-none md:shadow-none">
          {created ? (
            <div className="animate-fade-up" role="status" aria-live="polite">
              <span
                aria-hidden="true"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-2xl text-success"
              >
                ✓
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">Account created</h1>
              <p className="mt-3 text-muted-foreground">
                Welcome to Chief! You joined as a{" "}
                <strong className="text-foreground">{ROLE_LABELS[created.role]}</strong>.
              </p>

              {created.needsConfirmation ? (
                <p className="mt-2 break-words text-sm text-muted-foreground">
                  We sent a confirmation link to{" "}
                  <span className="font-semibold text-foreground">{created.email}</span>. Confirm your email, then sign in.
                </p>
              ) : user ? (
                <p className="mt-2 text-sm text-muted-foreground">You're signed in and ready to go.</p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Your account is ready. Sign in to continue.</p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                {user ? (
                  <GradientButton to={signedInDestination} size="lg">
                    {signedInDestinationLabel}
                  </GradientButton>
                ) : (
                  <GradientButton type="button" size="lg" onClick={showSignIn}>
                    Go to sign in
                  </GradientButton>
                )}
              </div>
            </div>
          ) : authLoading ? (
            <div role="status" aria-live="polite" className="py-16 text-center text-sm text-muted-foreground">
              Checking your account…
            </div>
          ) : user ? (
            <div className="animate-fade-up">
              <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">You're in</p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Signed in</h1>
              <p className="mt-3 break-words text-muted-foreground">
                Signed in as <span className="font-semibold text-foreground">{user.email}</span>
                {role ? ` · ${ROLE_LABELS[role]}` : ""}.
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <GradientButton to={role === "requester" ? "/dashboard" : "/discover"} size="lg">
                  {role === "requester" ? "Go to dashboard" : "Discover bills"}
                </GradientButton>
                <GradientButton
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={signingOut}
                  aria-busy={signingOut}
                  onClick={() => void handleSignOut()}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
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
                  ? "Sign in to manage your Chief account."
                  : "Choose how you'll use Chief. You can give or request help in Naira."}
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
                {mode === "signup" && (
                  <fieldset disabled={submitting}>
                    <legend className="text-sm font-semibold">I'm joining as</legend>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {roleOptions.map((option) => {
                        const selected = signupRole === option.value;
                        const descriptionId = `role-${option.value}-description`;

                        return (
                          <label
                            key={option.value}
                            className={`relative flex cursor-pointer flex-col rounded-2xl border p-4 transition focus-within:ring-4 focus-within:ring-primary/20 ${
                              selected
                                ? "border-primary bg-primary/10 ring-4 ring-primary/15"
                                : "border-input bg-background/60 hover:border-primary/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={option.value}
                              checked={selected}
                              aria-describedby={descriptionId}
                              onChange={() => setSignupRole(option.value)}
                              className="sr-only"
                            />
                            <span className="flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                className="bg-brand-gradient inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-primary-foreground"
                              >
                                {option.icon}
                              </span>
                              <span className="font-semibold text-foreground">{option.label}</span>
                            </span>
                            <span id={descriptionId} className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {option.description}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {mode === "signup" && (
                  <label htmlFor="full-name" className="block text-sm font-semibold">
                    Full name <span className="font-normal text-muted-foreground">(optional)</span>
                    <input
                      id="full-name"
                      type="text"
                      autoComplete="name"
                      maxLength={120}
                      disabled={submitting}
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className={inputClass}
                    />
                  </label>
                )}

                <label htmlFor="auth-email" className="block text-sm font-semibold">
                  Email
                  <input
                    id="auth-email"
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="email"
                    disabled={submitting}
                    aria-invalid={Boolean(error) || undefined}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label htmlFor="auth-password" className="block text-sm font-semibold">
                  Password
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={mode === "signup" ? 6 : undefined}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    disabled={submitting}
                    aria-invalid={Boolean(error) || undefined}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClass}
                  />
                </label>

                {error && (
                  <p
                    role="alert"
                    aria-live="assertive"
                    className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}

                <GradientButton
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  size="lg"
                  className="w-full"
                >
                  {mode === "signin" ? "Sign in" : "Create account"}
                </GradientButton>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New to Chief?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
                  className="font-semibold text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
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
      <div
        aria-hidden="true"
        className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-foreground/15 blur-3xl"
      />
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
        ].map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/25 text-xs font-bold"
            >
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
