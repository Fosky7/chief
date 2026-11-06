// src/types/index.ts
// Shared domain types for Chief. Mirrors supabase/migrations/001_profiles_bills_donations.sql.

/** Roles a visitor can pick when creating an account. */
export type SignUpRole = "donor" | "bill_requester";

/** All roles stored on a profile (admin is assigned server-side only). */
export type UserRole = SignUpRole | "admin";
/** Alias kept for compatibility with earlier modules. */
export type AppRole = UserRole;

export const SIGN_UP_ROLE_LABELS: Record<SignUpRole, string> = {
  donor: "Donor",
  bill_requester: "Bill requester",
};

export type BillCategory = "Education" | "Health" | "Housing" | "Utilities";
export type BillStatus = "pending" | "approved" | "rejected" | "funded";
export type DonationStatus = "pending" | "success" | "failed";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole | string;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  requester_id: string | null;
  title: string | null;
  description: string | null;
  category: BillCategory | string | null;
  city: string | null;
  /** Naira amount needed to settle the bill. */
  amount_required: number | null;
  /** Naira amount raised so far. */
  amount_raised: number;
  document_url: string | null;
  image_url: string | null;
  status: BillStatus | string;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  bill_id: string | null;
  donor_id: string | null;
  /** Naira amount. */
  amount: number | null;
  payment_reference: string | null;
  status: DonationStatus | string;
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
