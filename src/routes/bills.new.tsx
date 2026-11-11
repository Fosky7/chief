import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Check, Plus } from "lucide-react";
import { submitBill } from "@/services/bills";

export const Route = createFileRoute("/bills/new")({
  head: () => ({
    meta: [
      { title: "Submit a bill — Chief" },
      { name: "description", content: "Share a real bill with proof and let the community help you pay it." },
    ],
  }),
  component: NewBillPage,
});

const CATEGORIES = ["Medical", "School fees", "Rent", "Utilities", "Food", "Business", "Other"];

type Errors = Partial<Record<"title" | "story" | "category" | "billerName" | "amount" | "dueDate" | "proof" | "form", string>>;

function digitsOnly(v: string) {
  return v.replace(/[^0-9]/g, "");
}

function groupThousands(digits: string) {
  if (!digits) return "";
  return Number(digits).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

function NewBillPage() {
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
    setSubmitting(true);
    try {
      const amount = Number(amountDigits);
      const call = submitBill as unknown as (input: Record<string, unknown>) => Promise<unknown>;
      await call({
        title: title.trim(),
        story: story.trim(),
        category,
        billerName: billerName.trim(),
        biller_name: billerName.trim(),
        amount,
        amountNaira: amount,
        dueDate,
        due_date: dueDate,
        proof,
        proofFile: proof,
        file: proof,
      });
      setDone(true);
    } catch (err) {
      const anyErr = err as { errors?: Record<string, string>; message?: string };
      if (anyErr && anyErr.errors && typeof anyErr.errors === "object") {
        setErrors({ ...(anyErr.errors as Errors), form: anyErr.message || "Please fix the highlighted fields" });
      } else {
        setErrors({ form: anyErr?.message || "Could not submit your bill. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold">Pending review</h1>
        <p className="mt-2 text-muted-foreground">
          Thanks! "{title}" was submitted and is waiting for an admin to verify your proof. It will appear in Discover once approved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-lg border px-4 py-2 text-sm font-medium">Back home</Link>
        </div>
      </div>
    );
  }

  const field = "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500";
  const err = (m?: string) => (m ? <p role="alert" className="mt-1 text-sm text-red-600">{m}</p> : null);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold">Submit a bill</h1>
      <p className="mt-2 text-muted-foreground">Tell your story, attach proof and the community can help you pay it directly to the biller.</p>
      <form noValidate onSubmit={onSubmit} className="mt-8 space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <label htmlFor="bill-title" className="text-sm font-medium">Title</label>
          <input id="bill-title" className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ada's surgery at LUTH" />
          {err(errors.title)}
        </div>
        <div>
          <label htmlFor="bill-story" className="text-sm font-medium">Story</label>
          <textarea id="bill-story" rows={4} className={field} value={story} onChange={(e) => setStory(e.target.value)} placeholder="Explain what the bill is for and why you need help." />
          {err(errors.story)}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="bill-category" className="text-sm font-medium">Category</label>
            <select id="bill-category" className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Choose a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {err(errors.category)}
          </div>
          <div>
            <label htmlFor="bill-biller" className="text-sm font-medium">Biller name</label>
            <input id="bill-biller" className={field} value={billerName} onChange={(e) => setBillerName(e.target.value)} placeholder="e.g. Lagos University Teaching Hospital" />
            {err(errors.billerName)}
          </div>
          <div>
            <label htmlFor="bill-amount" className="text-sm font-medium">Amount (₦)</label>
            <input id="bill-amount" inputMode="numeric" className={field} value={groupThousands(amountDigits)} onChange={(e) => setAmountDigits(digitsOnly(e.target.value).slice(0, 12))} placeholder="250,000" />
            {amountDigits ? <p className="mt-1 text-sm font-semibold text-emerald-700" data-testid="amount-preview">₦{groupThousands(amountDigits)}</p> : null}
            {err(errors.amount)}
          </div>
          <div>
            <label htmlFor="bill-due" className="text-sm font-medium">Due date</label>
            <input id="bill-due" type="date" className={field} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            {err(errors.dueDate)}
          </div>
        </div>
        <div>
          <label htmlFor="bill-proof" className="text-sm font-medium">Proof of bill</label>
          <input id="bill-proof" type="file" accept="image/*,application/pdf" className={field} onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
          {proof ? <p className="mt-1 text-xs text-muted-foreground">Selected: {proof.name}</p> : null}
          {err(errors.proof)}
        </div>
        {errors.form ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p> : null}
        <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          <Plus className="h-4 w-4" /> {submitting ? "Submitting…" : "Submit bill"}
        </button>
      </form>
    </div>
  );
}
