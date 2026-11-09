export interface SampleBill {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  location: string;
  city: string;
  amount: number;
  goal: number;
  raised: number;
  backers: number;
  imageUrl: string;
  image: string;
  requester: string;
  dueDate: string;
  status: "approved" | "pending" | "rejected" | "funded" | "paid";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface BillDetail extends SampleBill {
  story: string;
  breakdown: { label: string; amount: number }[];
  updates: { date: string; text: string }[];
}

function bill(b: Omit<BillDetail, "description" | "city" | "goal" | "image">): BillDetail {
  return { ...b, description: b.story || b.summary, city: b.location, goal: b.amount, image: b.imageUrl };
}

export const sampleBills: BillDetail[] = [
  bill({
    id: "baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    summary: "Help Baba Tunde clear his post-surgery hospital balance.",
    category: "Health",
    location: "Ibadan",
    amount: 600000,
    raised: 420000,
    backers: 64,
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
    requester: "Tunde A.",
    dueDate: "2025-08-30",
    status: "approved",
    story: "Baba Tunde had successful surgery at UCH Ibadan and needs help with the remaining balance before discharge.",
    breakdown: [
      { label: "Surgery balance", amount: 450000 },
      { label: "Medication", amount: 150000 },
    ],
    updates: [{ date: "2025-06-10", text: "Hospital confirmed outstanding balance." }],
  }),
  bill({
    id: "single-mum-rent",
    title: "Rent for a single mum of three",
    summary: "Keep a roof over a young family in Lagos for another year.",
    category: "Housing",
    location: "Lagos",
    amount: 350000,
    raised: 90000,
    backers: 17,
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
    requester: "Funmi O.",
    dueDate: "2025-09-15",
    status: "approved",
    story: "Funmi works as a trader and is raising her three children alone. Her annual rent is due next month.",
    breakdown: [{ label: "Annual rent", amount: 350000 }],
    updates: [{ date: "2025-06-02", text: "Landlord invoice verified." }],
  }),
  bill({
    id: "ada-school-fees",
    title: "Ada's final-year school fees",
    summary: "Help Ada finish her final year at university.",
    category: "Education",
    location: "Enugu",
    amount: 250000,
    raised: 185000,
    backers: 32,
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
    requester: "Ada N.",
    dueDate: "2025-09-30",
    status: "approved",
    story: "Ada is one semester away from graduating and needs help with her final tuition.",
    breakdown: [
      { label: "Tuition", amount: 220000 },
      { label: "Books", amount: 30000 },
    ],
    updates: [{ date: "2025-06-01", text: "Bill verified by the school bursary." }],
  }),
  bill({
    id: "solar-pump-kaduna",
    title: "Solar water pump for a Kaduna village",
    summary: "Bring clean water to a farming community.",
    category: "Utilities",
    location: "Kaduna",
    amount: 800000,
    raised: 0,
    backers: 0,
    imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=70",
    requester: "Kafanchan CDA",
    dueDate: "2025-10-31",
    status: "pending",
    story: "The community borehole needs a solar pump. This bill is awaiting review by our team.",
    breakdown: [{ label: "Pump and installation", amount: 800000 }],
    updates: [],
  }),
];

export function getSampleBill(id: string): BillDetail | undefined {
  return sampleBills.find((b) => b.id === id);
}
