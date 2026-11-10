/** Shared domain types for Chief. Mirrors supabase/migrations/001_profiles_bills_donations.sql. */

export type UserRole = "donor" | "bill_requester" | "admin";

/** Roles a visitor may pick for themselves at sign up. */
export type SelfSelectableRole = Exclude<UserRole, "admin">;

export type BillStatus = "pending" | "approved" | "rejected" | "funded";

export type BillCategory = "Education" | "Health" | "Housing" | "Utilities";

export type DonationStatus = "pending" | "success" | "failed";

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  email: string | null;
  created_at: string;
}

export interface Bill {
  id: string;
  requester_id: string;
  title: string;
  description: string | null;
  category: BillCategory | string;
  city: string | null;
  /** Amounts are whole Naira. */
  goal_amount: number;
  raised_amount: number;
  status: BillStatus;
  image_url: string | null;
  proof_url: string | null;
  review_note: string | null;
  created_at: string;
}

export interface Donation {
  id: string;
  bill_id: string;
  donor_id: string | null;
  amount: number;
  paystack_reference: string | null;
  status: DonationStatus;
  created_at: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  role: SelfSelectableRole;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  donor: "Donor",
  bill_requester: "Bill requester",
  admin: "Admin",
};
