export interface BillDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  goal: number;
  raised: number;
  image: string | null;
  status: string;
}

/** Demo content only; these records are never submitted as live donations. */
export const sampleBills: BillDetail[] = [
  {
    id: 'demo-school-fees',
    title: "Ada's final-year school fees",
    description: 'Help a final-year student stay in school and complete her degree.',
    category: 'Education',
    city: 'Enugu',
    goal: 250000,
    raised: 185000,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
    status: 'demo',
  },
  {
    id: 'demo-hospital-bill',
    title: "Baba Tunde's hospital bill",
    description: 'Help a family cover the cost of essential hospital care.',
    category: 'Health',
    city: 'Ibadan',
    goal: 600000,
    raised: 420000,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
    status: 'demo',
  },
  {
    id: 'demo-family-rent',
    title: 'Rent for a single mum of three',
    description: 'Help keep a family in their home while they get back on their feet.',
    category: 'Housing',
    city: 'Lagos',
    goal: 350000,
    raised: 90000,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80',
    status: 'demo',
  },
];

export function getSampleBillById(id: string): BillDetail | undefined {
  return sampleBills.find((bill) => bill.id === id);
}

// Kept: still used by other files.
export function getSampleBill(id: string): BillDetail | null {
  return sampleBills.find((b) => b.id === id) ?? null;
}

/** Only approved (live) bills are listed publicly. */
