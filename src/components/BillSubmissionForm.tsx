import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import {
  BillValidationError,
  formatNairaInput,
  submitBill,
  validateBill,
  type NewBillErrors,
  type SavedBill,
} from "@/services/bills";

const CATEGORIES = ["Utilities", "Rent", "School fees", "Medical", "Transport", "Food", "Other"];

const inputClass =
  "w-full rounded-md border border-white/20 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-red-400">
      {message}
    </p>
  );
}

export function BillSubmissionForm() {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState("");
  const [billerName, setBillerName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<NewBillErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState<SavedBill | null>(null);

  const formattedAmount = amount ? formatNairaInput(amount) : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const input = { title, story, category, billerName, amount, dueDate, proofFile };
    const found = validateBill(input);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      const result = await submitBill(input);
      setSaved(result);
    } catch (err) {
      if (err instanceof BillValidationError) setErrors(err.errors);
      else setSubmitError(err instanceof Error ? err.message : "Could not submit bill");
    } finally {
      setSubmitting(false);
    }
  };

  if (saved) {
    return (
      <div className="space-y-3 rounded-xl border border-white/10 p-6" data-testid="bill-pending">
        <h2 className="text-xl font-semibold">Pending review</h2>
        <p className="text-sm opacity-80">
          "{saved.title}" for {formatNairaInput(saved.amount)} was submitted and is waiting for an admin to review it.
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4" aria-label="Submit a bill">
      <div className="space-y-1">
        <label htmlFor="bill-title" className="block text-sm font-medium">Title</label>
        <input id="bill-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        <FieldError id="bill-title-error" message={errors.title} />
      </div>
      <div className="space-y-1">
        <label htmlFor="bill-story" className="block text-sm font-medium">Story</label>
        <textarea id="bill-story" rows={4} className={inputClass} value={story} onChange={(e) => setStory(e.target.value)} />
        <FieldError id="bill-story-error" message={errors.story} />
      </div>
      <div className="space-y-1">
        <label htmlFor="bill-category" className="block text-sm font-medium">Category</label>
        <select id="bill-category" className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select a category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <FieldError id="bill-category-error" message={errors.category} />
      </div>
      <div className="space-y-1">
        <label htmlFor="bill-biller" className="block text-sm font-medium">Biller name</label>
        <input id="bill-biller" className={inputClass} value={billerName} onChange={(e) => setBillerName(e.target.value)} />
        <FieldError id="bill-biller-error" message={errors.billerName} />
      </div>
      <div className="space-y-1">
        <label htmlFor="bill-amount" className="block text-sm font-medium">Amount (₦)</label>
        <input
          id="bill-amount"
          inputMode="numeric"
          className={inputClass}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
        />
        {formattedAmount ? (
          <p className="text-xs opacity-80" data-testid="amount-preview">{formattedAmount}</p>
        ) : null}
        <FieldError id="bill-amount-error" message={errors.amount} />
      </div>
      <div className="space-y-1">
        <label htmlFor="bill-due" className="block text-sm font-medium">Due date</label>
        <input id="bill-due" type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <FieldError id="bill-due-error" message={errors.dueDate} />
      </div>
      <ImageUpload value={proofFile} onChange={setProofFile} error={errors.proofFile} />
      {submitError ? (
        <p role="alert" className="text-sm text-red-400">{submitError}</p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit bill"}
      </button>
    </form>
  );
}

export default BillSubmissionForm;
