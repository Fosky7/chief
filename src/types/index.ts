// Shared domain types for Chief. All money values are whole Naira (NGN).

export type UserRole = "donor" | "requester" | "admin";

/** Roles a visitor may choose at sign up (admin is assigned by operators). */
export type SignupRole = Exclude<UserRole, "admin">;

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
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
  currency: "NGN";
  image_url: string | null;
  proof_url: string | null;
  status: BillStatus;
  created_at: string;
}

export type DonationStatus = "pending" | "success" | "failed";

export interface Donation {
  id: string;
  bill_id: string;
  donor_id: string | null;
  amount: number;
  currency: "NGN";
  paystack_reference: string | null;
  status: DonationStatus;
  created_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  donor: "Donor",
  requester: "Bill requester",
  admin: "Admin",
};
