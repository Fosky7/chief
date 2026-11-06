/** Shared domain types mirroring supabase/migrations/001_profiles_bills_donations.sql */

export type UserRole = "donor" | "bill_requester" | "admin";

/** Roles a visitor may pick themselves when creating an account. */
export type SelectableRole = Exclude<UserRole, "admin">;

export const SELECTABLE_ROLES: ReadonlyArray<{ value: SelectableRole; label: string }> = [
  { value: "donor", label: "Donor" },
  { value: "bill_requester", label: "Bill requester" },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  donor: "Donor",
  bill_requester: "Bill requester",
  admin: "Admin",
};

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

export type BillCategory = "Education" | "Health" | "Housing" | "Utilities";
export type BillStatus = "pending" | "approved" | "rejected" | "funded";

export interface Bill {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  category: BillCategory;
  city: string;
  goal_amount: number;
  raised_amount: number;
  image_url: string | null;
  proof_url: string | null;
  status: BillStatus;
  created_at: string;
  updated_at: string;
}

export type DonationStatus = "pending" | "success" | "failed";

export interface Donation {
  id: string;
  bill_id: string;
  donor_id: string | null;
  amount: number;
  paystack_reference: string | null;
  status: DonationStatus;
  created_at: string;
}
