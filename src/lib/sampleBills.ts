/**
 * Realistic sample bills used when the live backend has no approved bills
 * (or cannot be reached). Field aliases are included so every UI surface
 * (swipe card, bill detail page) can read the shape it expects.
 */

export type BillStatus = "approved" | "pending" | "rejected" | "paid";

export interface Bill {
  id: string;
  title: string;
  description: string;
  story: string;
  category: string;
  city: string;
  location: string;
  /** Total amount needed (naira). */
  goal: number;
  needed: number;
  amountNeeded: number;
  /** Amount raised so far (naira). */
  raised: number;
  amountRaised: number;
  image: string;
  imageUrl: string;
  photo: string;
  status: BillStatus;
}

export type SampleBill = Bill;
export type ApprovedBill = Bill;
export type DeckBill = Bill;

interface SeedBill {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  goal: number;
  raised: number;
  image: string;
  status: BillStatus;
}

export function makeBill(seed: SeedBill): Bill {
  return {
    ...seed,
    story: seed.description,
    location: seed.city,
    needed: seed.goal,
    amountNeeded: seed.goal,
    amountRaised: seed.raised,
    imageUrl: seed.image,
    photo: seed.image,
  };
}

const seeds: SeedBill[] = [
  {
    id: "ada-school-fees",
    title: "Ada's final-year school fees",
    description:
      "Ada is a final-year accounting student at UNN. Her father lost his job this year and she needs help clearing her last semester's fees so she can sit for her exams.",
    category: "Education",
    city: "Enugu",
    goal: 250000,
    raised: 185000,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
    status: "approved",
  },
  {
    id: "baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    description:
      "Baba Tunde, 67, had emergency surgery at UCH Ibadan. His family has paid part of the bill and needs help with the balance before he can be discharged.",
    category: "Health",
    city: "Ibadan",
    goal: 600000,
    raised: 420000,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
    status: "approved",
  },
  {
    id: "single-mum-rent",
    title: "Rent for a single mum of three",
    description:
      "Chioma sells foodstuff in Yaba market and raises three children alone. Her annual rent is due and the landlord has given her one month.",
    category: "Housing",
    city: "Lagos",
    goal: 350000,
    raised: 90000,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
    status: "approved",
  },
  {
    id: "emeka-electricity",
    title: "Emeka's prepaid electricity arrears",
    description:
      "Emeka runs a small tailoring shop from home. His meter was disconnected over arrears and he can't work without power.",
    category: "Utilities",
    city: "Port Harcourt",
    goal: 150000,
    raised: 42000,
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=70",
    status: "approved",
  },
  {
    id: "zainab-waec-fees",
    title: "Zainab's WAEC registration",
    description:
      "Zainab is a bright SS3 student in Kano. Her family can't afford the WAEC registration fee before the deadline.",
    category: "Education",
    city: "Kano",
    goal: 45000,
    raised: 12500,
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=70",
    status: "approved",
  },
  {
    id: "ngozi-dialysis",
    title: "Ngozi's dialysis sessions",
    description:
      "Ngozi needs two dialysis sessions a week while she waits for a kidney transplant. Help cover the next month of treatment.",
    category: "Health",
    city: "Abuja",
    goal: 480000,
    raised: 310000,
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=70",
    status: "approved",
  },
  {
    id: "solar-pump-kaduna",
    title: "Solar water pump for a Kaduna village school",
    description:
      "A primary school outside Kaduna needs a solar pump so pupils have clean water during the day. This bill is still being reviewed by our team.",
    category: "Community",
    city: "Kaduna",
    goal: 900000,
    raised: 0,
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=70",
    status: "pending",
  },
];

export const sampleBills: Bill[] = seeds.map(makeBill);
export const SAMPLE_BILLS = sampleBills;

/** Short numeric ids used by the home page's featured cards. */
const aliases: Record<string, string> = {
  "1": "ada-school-fees",
  "2": "baba-tunde-hospital",
  "3": "single-mum-rent",
};

/** Look up a sample bill by id (or alias). Returns null when unknown. */
export function getSampleBill(id: string): Bill | null {
  const key = aliases[id] ?? id;
  return sampleBills.find((b) => b.id === key) ?? null;
}

/** Only bills that passed review appear in the swipe deck. */
export function getApprovedSampleBills(): Bill[] {
  return sampleBills.filter((b) => b.status === "approved");
}

export const approvedSampleBills = getApprovedSampleBills();
