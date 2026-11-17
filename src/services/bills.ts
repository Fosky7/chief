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

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export async function uploadBillProof(file: File, userId: string | null): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId ?? "anonymous"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  // Never let a slow/unavailable storage bucket block the bill insert.
  const { error } = (await withTimeout(
    Promise.resolve(
      db.storage.from(BILL_PROOFS_BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false }),
    ) as Promise<{ error: { message: string } | null }>,
    8000,
    { error: { message: "Upload timed out" } },
  )) as { error: { message: string } | null };
  if (error) {
    // Storage unavailable: keep small proofs inline so review can still see them.
    if (file.size <= 1.5 * 1024 * 1024) return await fileToDataUrl(file);
    throw new Error(`Proof upload failed: ${error.message}`);
  }
  const { data } = db.storage.from(BILL_PROOFS_BUCKET).getPublicUrl(path);
  return (data?.publicUrl as string) || path;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the proof file"));
    reader.readAsDataURL(file);
  });
}

export async function submitBill(input: NewBillInput): Promise<SavedBill> {
  const errors = validateBill(input);
  if (Object.keys(errors).length > 0) throw new BillValidationError(errors);

  const { data: sessionData } = await db.auth.getSession();
  let userId: string | null = sessionData?.session?.user?.id ?? null;
  if (!userId) {
    const { data: userData } = await db.auth.getUser();
    userId = userData?.user?.id ?? null;
  }
  if (!userId) throw new Error("Please sign in to submit a bill");

  const proofUrl = await uploadBillProof(input.proofFile as File, userId);
  const amount = parseNairaAmount(input.amount);

  const title = input.title.trim();
  const story = input.story.trim();
  const billerName = input.billerName.trim();
  // Common column names; any the table lacks are dropped and the insert retried.
  const row: Record<string, unknown> = {
    title,
    story,
    description: story,
    category: input.category,
    biller_name: billerName,
    biller: billerName,
    amount,
    goal: amount,
    due_date: input.dueDate,
    proof_url: proofUrl,
    status: "pending",
    user_id: userId,
    requester_id: userId,
  };

  // Insert without reading the row back: pending bills may not be readable
  // by the public select policy, which would fail the whole request.
  let lastMessage = "Unknown error";
  let saved = false;
  for (let attempt = 0; attempt < 16; attempt++) {
    const { error } = await db.from("bills").insert(row);
    if (!error) {
      saved = true;
      break;
    }
    lastMessage = error.message ?? lastMessage;
    const missing = /could not find the '([^']+)' column/i.exec(lastMessage);
    if (missing && missing[1] in row && missing[1] !== "title") {
      delete row[missing[1]];
      continue;
    }
    break;
  }
  if (!saved) throw new Error(`Could not save bill: ${lastMessage}`);

  return {
    id: "",
    title,
    status: "pending",
    proofUrl,
    amount,
  };
}
