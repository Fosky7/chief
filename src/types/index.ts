import type { Session, User } from "@supabase/supabase-js";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "donor" | "bill_requester";
export type SignUpRole = AppRole;
export type AuthMode = "signIn" | "signUp";

export type BillCategory =
  | "education"
  | "health"
  | "housing"
  | "utilities"
  | "other";

export type BillStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "funded"
  | "cancelled";

export type DonationStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends SignInCredentials {
  role: SignUpRole;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthContextValue extends AuthState {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: AppRole;
          full_name: string | null;
          avatar_url: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: AppRole;
          full_name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: AppRole;
          full_name?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bills: {
        Row: {
          id: string;
          requester_id: string;
          title: string;
          description: string;
          category: BillCategory;
          city: string;
          amount_required: number;
          amount_raised: number;
          status: BillStatus;
          document_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          title: string;
          description: string;
          category: BillCategory;
          city: string;
          amount_required: number;
          amount_raised?: number;
          status?: BillStatus;
          document_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          title?: string;
          description?: string;
          category?: BillCategory;
          city?: string;
          amount_required?: number;
          amount_raised?: number;
          status?: BillStatus;
          document_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bills_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      donations: {
        Row: {
          id: string;
          bill_id: string;
          donor_id: string | null;
          amount: number;
          currency: "NGN";
          status: DonationStatus;
          payment_reference: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bill_id: string;
          donor_id?: string | null;
          amount: number;
          currency?: "NGN";
          status?: DonationStatus;
          payment_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bill_id?: string;
          donor_id?: string | null;
          amount?: number;
          currency?: "NGN";
          status?: DonationStatus;
          payment_reference?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "donations_bill_id_fkey";
            columns: ["bill_id"];
            isOneToOne: false;
            referencedRelation: "bills";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "donations_donor_id_fkey";
            columns: ["donor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      bill_category: BillCategory;
      bill_status: BillStatus;
      donation_status: DonationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Bill = Database["public"]["Tables"]["bills"]["Row"];
export type Donation = Database["public"]["Tables"]["donations"]["Row"];
