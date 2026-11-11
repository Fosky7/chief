import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { submitBill } from "@/services/bills";

export const Route = createFileRoute("/bills/new")({
  head: () => ({
    meta: [
      { title: "Submit a bill · Chief" },
      { name: "description", content: "Share a bill you need help with. Our team reviews every bill before it goes live." },
    ],
  }),
  component: NewBillPage,
});

const CATEGORIES = ["School fees", "Medical", "Rent", "Utilities", "Food", "Transport", "Other"];

type FieldErrors = Partial<Record<"title" | "story" | "category" | "billerName" | "amount" | "dueDate" | "proof" | "form", string>>;

function digitsOnly(v: string) {
  return v.replace(/[^0-9]/g, "");
}

function formatNairaDisplay(raw: string) {
  const d = digitsOnly(raw).replace(/^0+(?=\d)/, "");
  if (!d) return "";
  return "₦" + Number(d).toLocaleString("en-US");
}

function NewBillPage() {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("");
  const [billerName, setBillerName] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!title.trim()) e.title = "Title is required";
    if (!story.trim()) e.story = "Story is required";
    if (!category) e.category = "Category is required";
    if (!billerName.trim()) e.billerName = "Biller name is required";
    const amt = Number(digitsOnly(amountDisplay));
    if (!amt || amt <= 0) e.amount = "Amount is required";
    if (!dueDate) e.dueDate = "Due date is required";
    if (!proof) e.proof = "Proof of bill is required";
    return e;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    try {
      const amount = Number(digitsOnly(amountDisplay));
      const call = submitBill as unknown as (input: Record<string, unknown>) => Promise<unknown>;
      await call({
        title: title.trim(),
        story: story.trim(),
        category,
        billerName: billerName.trim(),
        biller_name: billerName.trim(),
        amount,
        amountNaira: amount,
        amount_naira: amount,
        dueDate,
        due_date: dueDate,
        proof,
        proofFile: proof,
        file: proof,
      });
      setDone(true);
    } catch (err) {
      const maybe = err as { errors?: FieldErrors; message?: string };
      if (maybe && maybe.errors && typeof maybe.errors === "object") {
        setErrors({ ...maybe.errors });
      } else {
        setErrors({ form: maybe?.message || "We couldn't submit your bill. Please sign in and try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <span className="inline-block rounded-full bg-amber-400/15 px-4 py-1 text-sm font-semibold text-amber-300">Pending review</span>
        <h1 className="mt-4 text-3xl font-bold text-white">Thanks — your bill was submitted</h1>
        <p className="mt-3 text-slate-300">Our team checks every proof of bill before it goes live. You'll see it in the feed once it's approved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="rounded-full border border-white/20 px-5 py-2 text-sm text-white">Back home</Link>
        </div>
      </div>
    );
  }

  const input = "mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none";
  const err = (m?: string) => (m ? <p role="alert" className="mt-1 text-sm text-rose-400">{m}</p> : null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold text-white">Submit a bill</h1>
      <p className="mt-2 text-slate-300">Tell donors what you need. Every bill is reviewed before it's published.</p>
      <form noValidate onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="bill-title" className="text-sm font-medium text-slate-200">Title</label>
          <input id="bill-title" className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Help with Amaka's final-year school fees" />
          {err(errors.title)}
        </div>
        <div>
          <label htmlFor="bill-story" className="text-sm font-medium text-slate-200">Story</label>
          <textarea id="bill-story" rows={5} className={input} value={story} onChange={(e) => setStory(e.target.value)} placeholder="Explain the situation and how the money will be used." />
          {err(errors.story)}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="bill-category" className="text-sm font-medium text-slate-200">Category</label>
            <select id="bill-category" className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Choose a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {err(errors.category)}
          </div>
          <div>
            <label htmlFor="bill-biller" className="text-sm font-medium text-slate-200">Biller name</label>
            <input id="bill-biller" className={input} value={billerName} onChange={(e) => setBillerName(e.target.value)} placeholder="University of Lagos" />
            {err(errors.billerName)}
          </div>
          <div>
            <label htmlFor="bill-amount" className="text-sm font-medium text-slate-200">Amount (₦)</label>
            <input id="bill-amount" inputMode="numeric" className={input} value={amountDisplay} onChange={(e) => setAmountDisplay(formatNairaDisplay(e.target.value))} placeholder="₦0" />
            {err(errors.amount)}
          </div>
          <div>
            <label htmlFor="bill-due" className="text-sm font-medium text-slate-200">Due date</label>
            <input id="bill-due" type="date" className={input} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            {err(errors.dueDate)}
          </div>
        </div>
        <div>
          <label htmlFor="bill-proof" className="text-sm font-medium text-slate-200">Proof of bill</label>
          <input id="bill-proof" type="file" accept="image/*,application/pdf" className={input} onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
          <p className="mt-1 text-xs text-slate-400">Upload a photo or PDF of the invoice (max 10MB). Only reviewers see it.</p>
          {err(errors.proof)}
        </div>
        {err(errors.form)}
        <button type="submit" disabled={submitting} className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-60">
          {submitting ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
