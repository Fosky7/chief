import { Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { submitBill, BillValidationError } from "@/services/bills";
import { ImageUpload } from "@/components/ImageUpload";
import { useAuth } from "@/hooks/useAuth";

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
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none";

/** Bill submission form with naira formatting, validation and proof upload. */
export function BillSubmissionForm() {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("");
  const [billerName, setBillerName] = useState("");
  const [amountDigits, setAmountDigits] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [proof, setProof] = useState<File | null>(null);
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
    if (!proof) e.proof = "Proof of bill is required";
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
        proofFile: proof,
      });
      setDone(true);
    } catch (err) {
      if (err instanceof BillValidationError) {
        const { proofFile, ...rest } = err.errors;
        setErrors({ ...rest, proof: proofFile });
      } else {
        setErrors({ form: err instanceof Error ? err.message : "Could not submit your bill. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div data-testid="bill-pending" className="mx-auto max-w-xl py-4 text-center text-white">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
          <Check className="h-7 w-7 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold">Pending review</h1>
        <p className="mt-3 text-white/70">
          Thanks! “{title}” for {formatNairaDigits(amountDigits)} was submitted. Our team will check your proof of bill
          before it goes live to donors.
        </p>
        <Link to="/" className="mt-8 inline-block rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black">
          Back to home
        </Link>
      </div>
    );
  }

  const err = (k: ErrorKey) =>
    errors[k] ? (
      <p role="alert" className="mt-1 text-xs text-rose-400">
        {errors[k]}
      </p>
    ) : null;

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold">Submit a bill</h1>
      <p className="mt-2 text-white/70">Tell donors what you need help with and upload proof of the bill.</p>
      {signedIn === false && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-4 text-sm text-amber-200">
          <p>You'll need to sign in before submitting.</p>
          <form onSubmit={onSignIn} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="bill-signin-email" className="mb-1 block text-xs font-medium">Email</label>
              <input id="bill-signin-email" type="email" autoComplete="email" className={inputCls} value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="bill-signin-password" className="mb-1 block text-xs font-medium">Password</label>
              <input id="bill-signin-password" type="password" autoComplete="current-password" className={inputCls} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Your password" />
            </div>
            <button type="submit" disabled={authBusy} className="rounded-xl bg-amber-400 px-4 py-3 font-semibold text-black disabled:opacity-60">
              {authBusy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          {authError && (
            <p role="alert" className="mt-2 text-xs text-rose-300">{authError}</p>
          )}
        </div>
      )}
      <form noValidate onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="bill-title" className="mb-1 block text-sm font-medium">Title</label>
          <input id="bill-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Help keep the lights on for my family" />
          {err("title")}
        </div>
        <div>
          <label htmlFor="bill-story" className="mb-1 block text-sm font-medium">Story</label>
          <textarea id="bill-story" rows={4} className={inputCls} value={story} onChange={(e) => setStory(e.target.value)} placeholder="Share why you need support…" />
          {err("story")}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="bill-category" className="mb-1 block text-sm font-medium">Category</label>
            <select id="bill-category" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="" className="text-black">Choose a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="text-black">{c}</option>
              ))}
            </select>
            {err("category")}
          </div>
          <div>
            <label htmlFor="bill-biller" className="mb-1 block text-sm font-medium">Biller name</label>
            <input id="bill-biller" className={inputCls} value={billerName} onChange={(e) => setBillerName(e.target.value)} placeholder="Ikeja Electric" />
            {err("billerName")}
          </div>
          <div>
            <label htmlFor="bill-amount" className="mb-1 block text-sm font-medium">Amount (₦)</label>
            <input
              id="bill-amount"
              inputMode="numeric"
              className={inputCls}
              value={formatNairaDigits(amountDigits)}
              onChange={(e) => setAmountDigits(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="₦0"
            />
            {amountDigits && (
              <p data-testid="amount-preview" className="mt-1 text-xs text-white/60">
                {formatNairaDigits(amountDigits)}
              </p>
            )}
            {err("amount")}
          </div>
          <div>
            <label htmlFor="bill-due" className="mb-1 block text-sm font-medium">Due date</label>
            <input id="bill-due" type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            {err("dueDate")}
          </div>
        </div>
        <ImageUpload id="bill-proof" label="Proof of bill" value={proof} onChange={setProof} error={errors.proof} />
        {err("form")}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-black disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit bill"}
        </button>
      </form>
    </div>
  );
}

export default BillSubmissionForm;
