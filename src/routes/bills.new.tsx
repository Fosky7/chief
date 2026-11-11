import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GlowBackdrop } from "@/components/ui/brand";
import { ImageUpload } from "@/components/ImageUpload";
import { formatNaira } from "@/lib/currency";
import {
  ACCEPTED_PROOF_TYPES,
  BillValidationError,
  parseNairaAmount,
  submitBill,
  validateBillSubmission,
} from "@/services/bills";
import {
  BILL_CATEGORIES,
  type BillSubmissionErrors,
  type BillSubmissionInput,
  type SubmittedBill,
} from "@/types";

export const Route = createFileRoute("/bills/new")({
  head: () => ({ meta: [{ title: "Submit a bill — Chief" }] }),
  component: SubmitBillPage,
});

const inputClass =
  "mt-1.5 w-full rounded-xl border bg-background/80 px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20";

const emptyForm: BillSubmissionInput = {
  title: "",
  story: "",
  category: "",
  billerName: "",
  amount: "",
  dueDate: "",
  proof: null,
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function SubmitBillPage() {
  const [form, setForm] = useState<BillSubmissionInput>(emptyForm);
  const [errors, setErrors] = useState<BillSubmissionErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedBill | null>(null);

  function update<K extends keyof BillSubmissionInput>(key: K, value: BillSubmissionInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  const parsedAmount = parseNairaAmount(form.amount);
  const amountPreview =
    form.amount !== "" && Number.isFinite(parsedAmount) && parsedAmount > 0 ? formatNaira(parsedAmount) : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const found = validateBillSubmission(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError("Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);
    try {
      const bill = await submitBill(form);
      setSubmitted(bill);
      setForm(emptyForm);
    } catch (err) {
      if (err instanceof BillValidationError) {
        setErrors(err.errors);
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : "Could not submit your bill. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const invalid = (key: keyof BillSubmissionInput) => (errors[key] ? true : undefined);
  const border = (key: keyof BillSubmissionInput) => (errors[key] ? "border-destructive" : "border-input");

  if (submitted) {
    return (
      <div className="relative isolate mx-auto max-w-2xl px-4 py-16">
        <GlowBackdrop className="opacity-60" />
        <section className="glass ring-gradient shadow-elegant animate-fade-up rounded-3xl p-8 text-center">
          <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Submitted</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Pending review</h1>
          <p role="status" className="mt-3 text-muted-foreground">
            Thanks! &ldquo;{submitted.title}&rdquo; for {formatNaira(submitted.amount)} has been sent to our team.
            We&apos;ll verify the proof and biller before it goes live.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/bills/$id"
              params={{ id: submitted.id }}
              className="bg-brand-gradient shadow-elegant rounded-full px-6 py-3 font-semibold text-primary-foreground transition hover:brightness-110"
            >
              View your bill
            </Link>
            <button
              type="button"
              onClick={() => setSubmitted(null)}
              className="rounded-full border border-primary/30 px-6 py-3 font-semibold text-primary transition hover:bg-primary/10"
            >
              Submit another bill
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative isolate mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <GlowBackdrop className="opacity-60" />
      <p className="text-brand-gradient text-xs font-bold uppercase tracking-[0.18em]">Get help</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Submit a bill</h1>
      <p className="mt-3 text-muted-foreground">
        Tell donors what the bill is for and upload proof. Our team reviews every bill before it goes live.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="glass shadow-elegant mt-8 space-y-5 rounded-3xl bg-card/90 p-6 sm:p-8"
      >
        <Field id="bill-title" label="Title" error={errors.title}>
          <input
            id="bill-title"
            type="text"
            value={form.title}
            maxLength={120}
            onChange={(e) => update("title", e.target.value)}
            aria-invalid={invalid("title")}
            aria-describedby={errors.title ? "bill-title-error" : undefined}
            placeholder="e.g. Final-year school fees"
            className={`${inputClass} ${border("title")}`}
          />
        </Field>

        <Field id="bill-story" label="Story" error={errors.story}>
          <textarea
            id="bill-story"
            rows={5}
            value={form.story}
            onChange={(e) => update("story", e.target.value)}
            aria-invalid={invalid("story")}
            aria-describedby={errors.story ? "bill-story-error" : undefined}
            placeholder="Explain your situation and why this bill matters."
            className={`${inputClass} ${border("story")}`}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="bill-category" label="Category" error={errors.category}>
            <select
              id="bill-category"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              aria-invalid={invalid("category")}
              aria-describedby={errors.category ? "bill-category-error" : undefined}
              className={`${inputClass} ${border("category")}`}
            >
              <option value="">Choose a category</option>
              {BILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field id="bill-biller" label="Biller name" error={errors.billerName}>
            <input
              id="bill-biller"
              type="text"
              value={form.billerName}
              onChange={(e) => update("billerName", e.target.value)}
              aria-invalid={invalid("billerName")}
              aria-describedby={errors.billerName ? "bill-biller-error" : undefined}
              placeholder="e.g. Lagos University Teaching Hospital"
              className={`${inputClass} ${border("billerName")}`}
            />
          </Field>

          <Field id="bill-amount" label="Amount (₦)" error={errors.amount}>
            <input
              id="bill-amount"
              type="text"
              inputMode="numeric"
              value={String(form.amount)}
              onChange={(e) => update("amount", e.target.value)}
              aria-invalid={invalid("amount")}
              aria-describedby="bill-amount-preview"
              placeholder="e.g. 250000"
              className={`${inputClass} ${border("amount")}`}
            />
            <p id="bill-amount-preview" aria-live="polite" className="mt-1.5 text-sm text-muted-foreground">
              {amountPreview ? (
                <span data-testid="amount-preview" className="font-semibold text-foreground">
                  {amountPreview}
                </span>
              ) : (
                "Enter the full amount in naira"
              )}
            </p>
          </Field>

          <Field id="bill-due" label="Due date" error={errors.dueDate}>
            <input
              id="bill-due"
              type="date"
              value={form.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
              aria-invalid={invalid("dueDate")}
              aria-describedby={errors.dueDate ? "bill-due-error" : undefined}
              className={`${inputClass} ${border("dueDate")}`}
            />
          </Field>
        </div>

        <ImageUpload
          id="bill-proof"
          label="Proof of bill"
          value={form.proof}
          onChange={(file) => update("proof", file)}
          accept={ACCEPTED_PROOF_TYPES.join(",")}
          hint="Invoice, receipt or letter from the biller. JPG, PNG, WebP or PDF up to 5 MB."
          error={errors.proof}
        />

        {formError && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
          >
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-brand-gradient shadow-elegant w-full rounded-full px-6 py-3.5 text-base font-semibold text-primary-foreground transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit bill"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          You need to be <Link to="/auth" className="font-semibold text-primary underline-offset-4 hover:underline">signed in</Link> to submit a bill.
        </p>
      </form>
    </div>
  );
}
