// Realistic sample bills used as a fallback when the live backend has no
// approved bills yet (or is unreachable). Amounts are in Naira.

export type SampleBillCategory = "Education" | "Health" | "Housing" | "Utilities";
export type SampleBillStatus = "approved" | "pending" | "rejected" | "funded";

export interface SampleBill {
  id: string;
  title: string;
  category: SampleBillCategory;
  city: string;
  raised: number;
  goal: number;
  /** Remaining amount still needed (goal - raised, never negative). */
  needed: number;
  image: string;
  imageUrl: string;
  story: string;
  biller: string;
  dueDate: string | null;
  status: SampleBillStatus;
  requesterName: string | null;
  donorCount: number | null;
}

type SampleSeed = Omit<SampleBill, "needed" | "imageUrl">;

const seeds: SampleSeed[] = [
  {
    id: "sample-ada-school-fees",
    title: "Ada's final-year school fees",
    category: "Education",
    city: "Enugu",
    raised: 185000,
    goal: 250000,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
    story:
      "Ada is in her final year studying Nursing at the University of Nigeria. Her father's shop was flooded last rainy season and the family can no longer cover her last tuition instalment. Paying this bill means she can sit her final exams.",
    biller: "University of Nigeria, Nsukka",
    dueDate: "2026-09-30",
    status: "approved",
    requesterName: "Ada N.",
    donorCount: 37,
  },
  {
    id: "sample-baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    category: "Health",
    city: "Ibadan",
    raised: 420000,
    goal: 600000,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
    story:
      "Baba Tunde, 68, had emergency surgery after a stroke. He is recovering well, but the hospital will not discharge him until the balance is cleared. His children have paid what they can.",
    biller: "University College Hospital, Ibadan",
    dueDate: "2026-07-15",
    status: "approved",
    requesterName: "Funmi T.",
    donorCount: 52,
  },
  {
    id: "sample-lagos-rent-mum",
    title: "Rent for a single mum of three",
    category: "Housing",
    city: "Lagos",
    raised: 90000,
    goal: 350000,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
    story:
      "Blessing sells provisions in Yaba and raises three children alone. Her landlord has given notice for the yearly rent. Helping keeps the family in their home and the kids in their nearby school.",
    biller: "Adewale Properties Ltd",
    dueDate: "2026-08-01",
    status: "approved",
    requesterName: "Blessing O.",
    donorCount: 14,
  },
  {
    id: "sample-kano-electricity",
    title: "Electricity arrears for a home clinic",
    category: "Utilities",
    city: "Kano",
    raised: 35000,
    goal: 120000,
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=70",
    story:
      "Nurse Hauwa runs a small evening clinic from her home for neighbours who can't reach the general hospital. Her power is about to be disconnected over arrears. Keeping the lights on keeps the clinic open.",
    biller: "Kano Electricity Distribution Company",
    dueDate: "2026-06-20",
    status: "approved",
    requesterName: "Hauwa B.",
    donorCount: 9,
  },
  {
    id: "sample-abuja-jss-fees",
    title: "JSS 2 fees for twins Ebuka and Chidi",
    category: "Education",
    city: "Abuja",
    raised: 60000,
    goal: 180000,
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=70",
    story:
      "The twins' mother lost her job when her employer closed. The school has been patient, but the boys can't resume next term until fees are paid.",
    biller: "Unity Model College, Kubwa",
    dueDate: "2026-09-10",
    status: "approved",
    requesterName: "Ngozi E.",
    donorCount: 11,
  },
];

function toSampleBill(seed: SampleSeed): SampleBill {
  return {
    ...seed,
    imageUrl: seed.image,
    needed: Math.max(seed.goal - seed.raised, 0),
  };
}

/** All sample bills. */
export const sampleBills: SampleBill[] = seeds.map(toSampleBill);

/** Sample bills that would be visible to donors (approved and still needing money). */
export const liveSampleBills: SampleBill[] = sampleBills.filter(
  (b) => b.status === "approved" && b.needed > 0,
);

export function getSampleBill(id: string): SampleBill | undefined {
  return sampleBills.find((b) => b.id === id);
}

// Aliases kept for compatibility with other modules.
export const findSampleBill = getSampleBill;
export const getSampleBillById = getSampleBill;

export function isSampleBillId(id: string): boolean {
  return id.startsWith("sample-");
}
