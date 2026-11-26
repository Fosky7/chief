import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitBill, BillValidationError } from "@/services/bills";
import { ImageUpload } from "@/components/ImageUpload";
import { useAuth } from "@/hooks/useAuth";
import { proofSelectionError } from "@/types";

const CATEGORIES = ["Electricity", "Rent", "School fees", "Medical", "Water", "Internet"];

type ErrorKey = "title" | "story" | "category" | "billerName" | "amount" | "dueDate" | "proof" | "form";
type Errors = Partial<Record<ErrorKey, string>>;

/** Format raw digits as naira, e.g. "250000" -> "₦250,000". */
export function formatNairaDigits(digits: string): string {
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n)) return "";
  return "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

const labelCls = "mb-1.5 block text-sm font-semibold text-foreground";

const sectionCls = "space-y-5 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5";

function SectionTitle({ step, title, hint }: { step: number; title: string; hint: string }) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="bg-brand-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
      >
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

/** Bill submission form with naira formatting, validation and proof upload. */
export function BillSubmissionForm() {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("");
  const [billerName, setBillerName] = useState("");
  const [amountDigits, setAmountDigits] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [proofs, setProofs] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const { signIn } = useAuth();
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  async function onSignIn(ev: FormEvent) {
    ev.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    try {
      await signIn({ email: authEmail, password: authPassword });
      setSignedIn(true);
      setAuthPassword("");
    } catch {
      setAuthError("Invalid login credentials");
    } finally {
      setAuthBusy(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  function validate(): Errors {
    const e: Errors = {};
    if (!title.trim()) e.title = "Title is required";
    if (!story.trim()) e.story = "Story is required";
    if (!category) e.category = "Category is required";
    if (!billerName.trim()) e.billerName = "Biller name is required";
    if (!amountDigits || Number(amountDigits) <= 0) e.amount = "Amount is required";
    if (!dueDate) e.dueDate = "Due date is required";
    if (proofs.length === 0) {
      e.proof = "Proof of bill is required";
    } else {
      const problem = proofSelectionError(proofs);
      if (problem) e.proof = problem;
    }
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setErrors({ form: "Please sign in to submit a bill" });
      return;
    }
    setSubmitting(true);
    try {
      await submitBill({
        title: title.trim(),
        story: story.trim(),
        category,
        billerName: billerName.trim(),
        amount: Number(amountDigits),
        dueDate,
        proofFiles: proofs,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof BillValidationError) {
        const { proofFile, proofFiles, ...rest } = err.errors;
        const proofMessage = proofFiles ?? proofFile;
        setErrors(proofMessage ? { ...rest, proof: proofMessage } : rest);
      } else {
        setErrors({ form: err instanceof Error ? err.message : "Could not submit your bill. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div data-testid="bill-pending" className="mx-auto max-w-xl py-4 text-center text-foreground">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="h-7 w-7 text-emerald-700" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Pending review</h1>
        <p className="mt-3 text-muted-foreground">
          Thanks! “{title}” for {formatNairaDigits(amountDigits)} was submitted. Our team will check your proof of bill
          before it goes live to donors.
        </p>
        <Link
          to="/"
          className="bg-brand-gradient mt-8 inline-block rounded-xl px-5 py-3 font-semibold text-primary-foreground shadow-elegant"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const err = (k: ErrorKey) =>
    errors[k] ? (
      <p role="alert" className="mt-1.5 text-sm font-medium text-rose-600 dark:text-rose-400">
        {errors[k]}
      </p>
    ) : null;

  return (
    <div className="text-foreground" data-testid="bill-form-root">
      <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">New bill</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">Submit a bill</h1>
      <p className="mt-2 text-base text-muted-foreground">
        Tell donors what you need help with and upload proof of the bill.
      </p>
      {signedIn === false && (
        <div
          data-testid="bill-signin-box"
          className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground sm:p-5"
        >
          <p className="font-semibold text-foreground">You'll need to sign in before submitting.</p>
          <p className="mt-1 text-muted-foreground">Use your Chief account email and password.</p>
          <form onSubmit={onSignIn} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="bill-signin-email" className={labelCls}>Email</label>
              <input id="bill-signin-email" type="email" autoComplete="email" className={inputCls} value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="bill-signin-password" className={labelCls}>Password</label>
              <input id="bill-signin-password" type="password" autoComplete="current-password" className={inputCls} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Your password" />
            </div>
            <button
              type="submit"
              disabled={authBusy}
              className="bg-brand-gradient rounded-xl px-5 py-3 font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
            >
              {authBusy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          {authError && (
            <p role="alert" className="mt-2 text-sm font-medium text-rose-600 dark:text-rose-400">{authError}</p>
          )}
        </div>
      )}
      <form noValidate onSubmit={onSubmit} className="mt-8 space-y-6">
        <section className={sectionCls} aria-label="About the bill">
          <SectionTitle step={1} title="About the bill" hint="A clear title and an honest, short story." />
        <div>
          <label htmlFor="bill-title" className={labelCls}>Title</label>
          <input id="bill-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Help keep the lights on for my family" />
          {err("title")}
        </div>
        <div>
          <label htmlFor="bill-story" className={labelCls}>Story</label>
          <textarea id="bill-story" rows={4} className={inputCls} value={story} onChange={(e) => setStory(e.target.value)} placeholder="Share why you need support…" />
          {err("story")}
        </div>
        </section>
        <section className={sectionCls} aria-label="Bill details">
          <SectionTitle step={2} title="Bill details" hint="Who gets paid, how much and by when." />
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="bill-category" className={labelCls}>Category</label>
            <select id="bill-category" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="" className="text-black">Choose a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="text-black">{c}</option>
              ))}
            </select>
            {err("category")}
          </div>
          <div>
            <label htmlFor="bill-biller" className={labelCls}>Biller name</label>
            <input id="bill-biller" className={inputCls} value={billerName} onChange={(e) => setBillerName(e.target.value)} placeholder="Ikeja Electric" />
            {err("billerName")}
          </div>
          <div>
            <label htmlFor="bill-amount" className={labelCls}>Amount (₦)</label>
            <input
              id="bill-amount"
              inputMode="numeric"
              className={inputCls}
              value={formatNairaDigits(amountDigits)}
              onChange={(e) => setAmountDigits(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="₦0"
            />
            {amountDigits && (
              <p data-testid="amount-preview" className="mt-1.5 text-sm text-muted-foreground">
                {formatNairaDigits(amountDigits)}
              </p>
            )}
            {err("amount")}
          </div>
          <div>
            <label htmlFor="bill-due" className={labelCls}>Due date</label>
            <input id="bill-due" type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            {err("dueDate")}
          </div>
        </div>
        </section>
        <section className={sectionCls} aria-label="Proof">
          <SectionTitle step={3} title="Proof" hint="Attach the invoice so our team can verify it." />
          <ImageUpload
            id="bill-proof"
            label="Proof of bill"
            files={proofs}
            onFilesChange={setProofs}
            error={errors.proof}
          />
        </section>
        {err("form")}
        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-gradient w-full rounded-xl px-5 py-3.5 text-base font-semibold text-primary-foreground shadow-elegant transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit bill"}
        </button>
      </form>
    </div>
  );
}

export default BillSubmissionForm;
