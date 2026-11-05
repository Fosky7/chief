// Shared domain types for Chief.

export type AuthMode = "signIn" | "signUp";

/** Roles a visitor can choose when creating an account. */
export type SignUpRole = "donor" | "bill_requester";

/** All roles stored in the database (admin is assigned server-side only). */
export type AppRole = SignUpRole | "admin";

export type BillCategory = "Education" | "Health" | "Housing" | "Utilities";
export type BillStatus = "pending" | "approved" | "rejected" | "funded";
export type DonationStatus = "pending" | "success" | "failed";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: BillCategory;
  city: string;
  currency: "NGN";
  amount_required: number;
  amount_raised: number;
  document_url: string | null;
  image_url: string | null;
  status: BillStatus;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  bill_id: string;
  donor_id: string | null;
  amount: number;
  currency: "NGN";
  payment_reference: string | null;
  status: DonationStatus;
  created_at: string;
  updated_at: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpInput extends Credentials {
  role: SignUpRole;
}
