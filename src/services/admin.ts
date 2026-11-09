import { supabase } from '@/integrations/supabase/client';

export type AdminQueueBill = {
  id: string;
  title?: string | null;
  description?: string | null;
  amount?: number | null;
  status?: string | null;
  funded_amount?: number | null;
  created_at?: string | null;
  [key: string]: unknown;
};

export type AdminDonation = {
  id: string;
  bill_id?: string | null;
  amount?: number | null;
  status?: string | null;
  donor_name?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
};

const PENDING_BILL_STATUSES = ['pending', 'pending_review', 'under_review'];

export async function fetchAdminQueue(): Promise<AdminQueueBill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .in('status', PENDING_BILL_STATUSES)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminQueueBill[];
}

export async function approveBill(billId: string): Promise<void> {
  const { error } = await supabase.from('bills').update({ status: 'approved' }).eq('id', billId);
  if (error) throw error;
}

export async function rejectBill(billId: string): Promise<void> {
  const { error } = await supabase.from('bills').update({ status: 'rejected' }).eq('id', billId);
  if (error) throw error;
}

export async function markBillPaid(billId: string): Promise<void> {
  const { error } = await supabase.from('bills').update({ status: 'paid' }).eq('id', billId);
  if (error) throw error;
}

export async function fetchPendingDonations(): Promise<AdminDonation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminDonation[];
}

export async function fetchApprovedDonations(): Promise<AdminDonation[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminDonation[];
}

export async function updateDonationStatus(donationId: string, status: string): Promise<void> {
  const { error } = await supabase.from('donations').update({ status }).eq('id', donationId);
  if (error) throw error;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return false;
  const userId = authData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (!profileError && profile?.role) {
    return ['admin', 'super_admin'].includes(String(profile.role).toLowerCase());
  }

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (rolesError) return false;
  return (roles ?? []).some((row: { role?: string | null }) =>
    ['admin', 'super_admin'].includes(String(row.role ?? '').toLowerCase()),
  );
}
