export type UserRole = "user" | "admin" | "biller";

export type BillStatus = "pending" | "approved" | "rejected" | "funded" | "paid";

export interface Bill {
  id: string;
  title: string;
  chamber: string | null;
  sponsor: string | null;
  status: BillStatus | string;
  summary: string | null;
  target_amount: number | null;
  raised_amount: number | null;
  created_at: string | null;
  submitted_by?: string | null;
  [key: string]: unknown;
}

export interface Donation {
  id: string;
  bill_id: string;
  user_id: string | null;
  amount: number;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface Profile {
  id: string;
  role?: UserRole | string | null;
  full_name?: string | null;
  [key: string]: unknown;
}
