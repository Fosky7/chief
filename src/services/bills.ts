import { supabase } from "@/integrations/supabase/client";

export const BILL_PROOFS_BUCKET = "bill-proofs";

export interface NewBillInput {
  title: string;
  story: string;
  category: string;
  billerName: string;
  amount: number | string;
  dueDate: string;
  proofFile: File | null;
}

export type NewBillErrors = Partial<Record<keyof NewBillInput, string>>;

export interface SavedBill {
  id: string;
  title: string;
  status: "pending";
  proofUrl: string;
  amount: number;
}

/** Parse a naira amount typed by a user, e.g. "₦250,000" -> 250000. */
export function parseNairaAmount(value: number | string): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return NaN;
  return Number(cleaned);
}

/** Format a typed amount as naira, e.g. 250000 -> "₦250,000". */
export function formatNairaInput(value: number | string): string {
  const n = parseNairaAmount(value);
  if (!Number.isFinite(n)) return "";
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export function validateBill(input: NewBillInput): NewBillErrors {
  const errors: NewBillErrors = {};
  if (!input.title?.trim()) errors.title = "Title is required";
  if (!input.story?.trim()) errors.story = "Story is required";
  if (!input.category?.trim()) errors.category = "Category is required";
  if (!input.billerName?.trim()) errors.billerName = "Biller name is required";
  const amount = parseNairaAmount(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) errors.amount = "Enter an amount greater than ₦0";
  if (!input.dueDate) errors.dueDate = "Due date is required";
  if (!input.proofFile) errors.proofFile = "Proof of bill is required";
  return errors;
}

export class BillValidationError extends Error {
  errors: NewBillErrors;
  constructor(errors: NewBillErrors) {
    super("Please fix the highlighted fields");
    this.errors = errors;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function uploadBillProof(file: File, userId: string | null): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId ?? "anonymous"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await db.storage
    .from(BILL_PROOFS_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw new Error(`Proof upload failed: ${error.message}`);
  const { data } = db.storage.from(BILL_PROOFS_BUCKET).getPublicUrl(path);
  return (data?.publicUrl as string) || path;
}

export async function submitBill(input: NewBillInput): Promise<SavedBill> {
  const errors = validateBill(input);
  if (Object.keys(errors).length > 0) throw new BillValidationError(errors);

  const { data: userData } = await db.auth.getUser();
  const userId: string | null = userData?.user?.id ?? null;
  if (!userId) throw new Error("Please sign in to submit a bill");

  const proofUrl = await uploadBillProof(input.proofFile as File, userId);
  const amount = parseNairaAmount(input.amount);

  const base = {
    title: input.title.trim(),
    story: input.story.trim(),
    category: input.category,
    biller_name: input.billerName.trim(),
    amount,
    due_date: input.dueDate,
    proof_url: proofUrl,
    status: "pending",
  };

  let result = await db.from("bills").insert({ ...base, user_id: userId }).select("id").single();
  if (result.error && (result.error.code === "PGRST204" || /user_id/.test(result.error.message ?? ""))) {
    result = await db.from("bills").insert(base).select("id").single();
  }
  if (result.error) throw new Error(`Could not save bill: ${result.error.message}`);

  return {
    id: String(result.data?.id ?? ""),
    title: base.title,
    status: "pending",
    proofUrl,
    amount,
  };
}
