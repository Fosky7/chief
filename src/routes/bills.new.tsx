import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import * as billsService from "@/services/bills";
import { BILL_CATEGORIES } from "@/types";

export const Route = createFileRoute("/bills/new")({
  head: () => ({
    meta: [
      { title: "Submit a bill · Chief" },
      { name: "description", content: "Submit a real bill with proof so the community can help pay it." },
    ],
  }),
  component: NewBillPage,
});

type FieldErrors = Partial<Record<"title" | "story" | "category" | "billerName" | "amount" | "dueDate" | "proof" | "form", string>>;

function categoryOptions(): { value: string; label: string }[] {
  const list = (BILL_CATEGORIES as unknown as readonly unknown[]) ?? [];
  return list.map((c) => {
    if (typeof c === "string") return { value: c, label: c.charAt(0).toUpperCase() + c.slice(1) };
    const o = c as { value?: string; id?: string; label?: string; name?: string };
    const value = o.value ?? o.id ?? o.label ?? o.name ?? "";
    return { value, label: o.label ?? o.name ?? value };
  });
}

function digitsOnly(v: string) {
  return v.replace(/[^0-9]/g, "");
}

function formatAmountPreview(raw: string) {
  const n = Number(digitsOnly(raw));
  if (!raw || !Number.isFinite(n) || n <= 0) return "";
  return "₦" + n.toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

/**
 * Synchronously detect a persisted Supabase session so the sign-in prompt is
 * rendered on the very first paint for signed-out visitors (no flash/delay).
 * getSession() below remains the source of truth and corrects this value.
 */
function hasStoredSession(): boolean | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && /^sb-.+-auth-token$/.test(key) && window.localStorage.getItem(key)) return true;
    }
    return false;
  } catch {
    return null;
  }
}

function NewBillPage() {
  const categories = useMemo(categoryOptions, []);
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState(categories[0]?.value ?? "");
  const [billerName, setBillerName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ title: string } | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(hasStoredSession);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  async function onSignIn(ev: FormEvent) {
    ev.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error || !data.session) throw new Error("Invalid login credentials");
      setSignedIn(true);
      setAuthPassword("");
    } catch {
      setAuthError("Invalid login credentials");
    } finally {
      setAuthBusy(false);
    }
  }

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSignedIn(!!data.session))
      .catch(() => setSignedIn(false));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);

  const preview = formatAmountPreview(amount);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!title.trim()) e.title = "Title is required";
    if (!story.trim()) e.story = "Story is required";
    if (!category) e.category = "Category is required";
    if (!billerName.trim()) e.billerName = "Biller name is required";
    const n = Number(digitsOnly(amount));
    if (!amount || !n || n <= 0) e.amount = "Enter an amount greater than ₦0";
    if (!dueDate) e.dueDate = "Due date is required";
    if (!proof) e.proof = "Proof of bill is required";
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSubmitting(true);
    try {
      const raw = digitsOnly(amount);
      const input: Record<string, unknown> = {
        title: title.trim(),
        story: story.trim(),
        category,
        billerName: billerName.trim(),
        amount: raw,
        amountNaira: Number(raw),
        dueDate,
        proof,
        proofFile: proof,
      };
      const submit = (billsService as unknown as { submitBill: (i: unknown) => Promise<unknown> }).submitBill;
      await submit(input);
      setSubmitted({ title: title.trim() });
    } catch (err) {
      const maybe = err as { errors?: Record<string, string>; message?: string };
      if (maybe && maybe.errors && typeof maybe.errors === "object") {
        setErrors({ ...maybe.errors, form: maybe.message ?? "Please fix the highlighted fields" });
      } else {
        setErrors({ form: maybe?.message ?? "Could not submit the bill. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Pending review</h1>
        <p className="mt-2 text-muted-foreground">
          “{submitted.title}” was submitted. Our team checks the proof before it goes live to donors.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-lg border px-4 py-2 text-sm">Back home</Link>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
            onClick={() => {
              setSubmitted(null);
              setTitle(""); setStory(""); setBillerName(""); setAmount(""); setDueDate(""); setProof(null);
            }}
          >
            Submit another
          </button>
        </div>
      </main>
    );
  }

  const inputCls = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm";
  const errCls = "mt-1 text-sm text-red-500";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Submit a bill</h1>
      <p className="mt-2 text-muted-foreground">
        Share what you need, attach proof, and the community can help pay it directly to the biller.
      </p>
      {signedIn === false && (
        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm">
          <p>You need to be signed in to submit a bill.</p>
          <form onSubmit={onSignIn} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label htmlFor="signin-email" className="text-sm font-medium">Email</label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="signin-password" className="text-sm font-medium">Password</label>
              <input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={authBusy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {authBusy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          {authError && <p className="mt-2 text-sm text-red-500">{authError}</p>}
        </div>
      )}
      <form noValidate onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="bill-title" className="text-sm font-medium">Title</label>
          <input id="bill-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mum's hospital bill at LUTH" />
          {errors.title && <p className={errCls} role="alert">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="bill-story" className="text-sm font-medium">Story</label>
          <textarea id="bill-story" rows={5} className={inputCls} value={story} onChange={(e) => setStory(e.target.value)} placeholder="Tell donors why this bill matters" />
          {errors.story && <p className={errCls}>{errors.story}</p>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="bill-category" className="text-sm font-medium">Category</label>
            <select id="bill-category" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            {errors.category && <p className={errCls}>{errors.category}</p>}
          </div>
          <div>
            <label htmlFor="bill-biller" className="text-sm font-medium">Biller name</label>
            <input id="bill-biller" className={inputCls} value={billerName} onChange={(e) => setBillerName(e.target.value)} placeholder="e.g. Lagos University Teaching Hospital" />
            {errors.billerName && <p className={errCls}>{errors.billerName}</p>}
          </div>
          <div>
            <label htmlFor="bill-amount" className="text-sm font-medium">Amount (₦)</label>
            <input id="bill-amount" inputMode="numeric" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="250000" />
            {preview && <p className="mt-1 text-sm font-semibold text-emerald-600" data-testid="amount-preview">{preview}</p>}
            {errors.amount && <p className={errCls}>{errors.amount}</p>}
          </div>
          <div>
            <label htmlFor="bill-due" className="text-sm font-medium">Due date</label>
            <input id="bill-due" type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            {errors.dueDate && <p className={errCls}>{errors.dueDate}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="bill-proof" className="text-sm font-medium">Proof of bill</label>
          <input
            id="bill-proof"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className={inputCls}
            onChange={(e) => setProof(e.target.files?.[0] ?? null)}
          />
          {proof && <p className="mt-1 text-xs text-muted-foreground">{proof.name}</p>}
          {errors.proof && <p className={errCls}>{errors.proof}</p>}
        </div>
        {errors.form && <p className={errCls} role="alert">{errors.form}</p>}
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          <Plus className="h-4 w-4" />
          {submitting ? "Submitting…" : "Submit bill"}
        </button>
      </form>
    </main>
  );
}
