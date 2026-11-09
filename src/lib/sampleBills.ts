export interface SampleBill {
  id: string;
  title: string;
  summary: string;
  category: string;
  location: string;
  amount: number;
  raised: number;
  backers: number;
  imageUrl: string;
  requester: string;
  dueDate: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface BillDetail extends SampleBill {
  story: string;
  breakdown: { label: string; amount: number }[];
  updates: { date: string; text: string }[];
}

export const sampleBills: BillDetail[] = [
  {
    id: "school-fees-ada",
    title: "Ada's final-year school fees",
    summary: "Help Ada finish her nursing degree at UNILAG.",
    category: "Education",
    location: "Lagos",
    amount: 350000,
    raised: 120000,
    backers: 18,
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    requester: "Ada O.",
    dueDate: "2025-09-30",
    story: "Ada is one semester away from graduating as a registered nurse.",
    breakdown: [
      { label: "Tuition", amount: 300000 },
      { label: "Books", amount: 50000 },
    ],
    updates: [{ date: "2025-06-01", text: "Bill verified by the school bursary." }],
  },
  {
    id: "rent-chinedu",
    title: "Chinedu's shop rent",
    summary: "Keep a small tailoring business open for another year.",
    category: "Business",
    location: "Enugu",
    amount: 480000,
    raised: 300000,
    backers: 41,
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800",
    requester: "Chinedu E.",
    dueDate: "2025-08-15",
    story: "Chinedu employs two apprentices and needs to renew his lease.",
    breakdown: [{ label: "Annual rent", amount: 480000 }],
    updates: [{ date: "2025-05-20", text: "Landlord invoice uploaded." }],
  },
  {
    id: "hospital-bisi",
    title: "Mama Bisi's hospital bill",
    summary: "Cover post-surgery care at LUTH.",
    category: "Health",
    location: "Lagos",
    amount: 650000,
    raised: 90000,
    backers: 12,
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
    requester: "Tunde B.",
    dueDate: "2025-07-31",
    story: "Mama Bisi had successful surgery and needs help with the final bill.",
    breakdown: [
      { label: "Surgery balance", amount: 500000 },
      { label: "Medication", amount: 150000 },
    ],
    updates: [{ date: "2025-06-10", text: "Hospital confirmed outstanding balance." }],
  },
  {
    id: "electricity-community",
    title: "Community transformer repair",
    summary: "Restore power to 40 homes in Ibadan.",
    category: "Community",
    location: "Ibadan",
    amount: 900000,
    raised: 610000,
    backers: 77,
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800",
    requester: "Oke-Ado CDA",
    dueDate: "2025-08-01",
    story: "The street transformer blew last month; residents are pooling funds.",
    breakdown: [{ label: "Repair and parts", amount: 900000 }],
    updates: [{ date: "2025-06-05", text: "Electrician quote verified." }],
  },
];

/**
 * Curated bills reachable from their detail page (featured links, tests)
 * but not part of the Discover deck.
 */
export const detailBills: BillDetail[] = [
  {
    id: "baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    summary: "Help Baba Tunde clear his surgery bill at UCH Ibadan.",
    description: "Baba Tunde needs help settling the balance of his surgery at UCH Ibadan.",
    category: "Health",
    location: "Ibadan",
    city: "Ibadan",
    amount: 600000,
    goal: 600000,
    raised: 420000,
    status: "approved",
    backers: 54,
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
    requester: "Kemi T.",
    dueDate: "2025-08-20",
    story: "Baba Tunde needs help settling the balance of his surgery at UCH Ibadan.",
    breakdown: [{ label: "Surgery balance", amount: 600000 }],
    updates: [{ date: "2025-06-12", text: "Hospital invoice verified." }],
  },
  {
    id: "single-mum-rent",
    title: "Rent for a single mum of three",
    summary: "Keep a roof over a family of four in Lagos.",
    description: "A single mum of three needs help renewing her annual rent in Lagos.",
    category: "Housing",
    location: "Lagos",
    city: "Lagos",
    amount: 350000,
    goal: 350000,
    raised: 90000,
    status: "approved",
    backers: 9,
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    requester: "Funmi A.",
    dueDate: "2025-09-01",
    story: "A single mum of three needs help renewing her annual rent in Lagos.",
    breakdown: [{ label: "Annual rent", amount: 350000 }],
    updates: [{ date: "2025-06-02", text: "Landlord invoice uploaded." }],
  },
  {
    id: "solar-pump-kaduna",
    title: "Solar water pump for a Kaduna village",
    summary: "Bring clean water to a farming community.",
    description: "A farming community in Kaduna needs a solar-powered borehole pump.",
    category: "Utilities",
    location: "Kaduna",
    city: "Kaduna",
    amount: 800000,
    goal: 800000,
    raised: 0,
    status: "pending",
    backers: 0,
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800",
    requester: "Kaduna Farmers Co-op",
    dueDate: "2025-10-01",
    story: "A farming community in Kaduna needs a solar-powered borehole pump.",
    breakdown: [{ label: "Pump and panels", amount: 800000 }],
    updates: [],
  },
];

export function getSampleBill(id: string): BillDetail | undefined {
  return sampleBills.find((b) => b.id === id) ?? detailBills.find((b) => b.id === id);
}
