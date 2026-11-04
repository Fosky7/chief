import type { Session, User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/database.types";

/** Account roles supported by Chief during sign-up. */
export const SIGNUP_ROLES = ["donor", "requester"] as const;

export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const ROLE_LABELS: Record<SignupRole, string> = {
  donor: "Donor",
  requester: "Bill requester",
};

export function isSignupRole(value: unknown): value is SignupRole {
  return typeof value === "string" && SIGNUP_ROLES.includes(value as SignupRole);
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface SignUpInput {
  email: string;
  password: string;
  role: SignupRole;
  fullName?: string;
}

export interface AuthActionResult {
  error: string | null;
}

export interface SignInResult extends AuthActionResult {
  user: User | null;
  session: Session | null;
}

export interface SignUpResult extends AuthActionResult {
  user: User | null;
  session: Session | null;
  needsConfirmation: boolean;
}

export interface SignOutResult extends AuthActionResult {}

export interface AuthState {
  user: User | null;
  session: Session | null;
  role: SignupRole | null;
  loading: boolean;
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signUp: (input: SignUpInput) => Promise<SignUpResult>;
  signOut: () => Promise<SignOutResult>;
}
