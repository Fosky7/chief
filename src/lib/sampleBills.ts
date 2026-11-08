/**
 * Realistic sample bills used as a fallback when the live backend has no
 * approved bills (or is unreachable). Amounts are in whole Naira.
 */

export type BillCategory = "Education" | "Health" | "Housing" | "Utilities";
export type BillStatus = "approved" | "pending" | "rejected" | "funded";

export interface SampleBill {
  id: string;
  title: string;
  category: BillCategory;
  city: string;
  raised: number;
  goal: number;
  story: string;
  biller: string;
  dueDate: string | null;
  imageUrl: string | null;
  /** Alias of imageUrl kept for older consumers. */
  image: string | null;
  requesterName: string | null;
  donorCount: number | null;
  status: BillStatus;
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

function make(b: Omit<SampleBill, "image">): SampleBill {
  return { ...b, image: b.imageUrl };
}

export const sampleBills: SampleBill[] = [
  make({
    id: "sample-ada-school-fees",
    title: "Ada's final-year school fees",
    category: "Education",
    city: "Enugu",
    raised: 185000,
    goal: 250000,
    story:
      "Ada is in her final year studying Nursing at UNEC. Her father lost his job in March and the last instalment of her fees is due before exams. Every bit helps her graduate on time.",
    biller: "University of Nigeria, Enugu Campus",
    dueDate: "2026-12-15",
    imageUrl: img("photo-1523050854058-8df90110c9f1"),
    requesterName: "Ada O.",
    donorCount: 42,
    status: "approved",
  }),
  make({
    id: "sample-baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    category: "Health",
    city: "Ibadan",
    raised: 420000,
    goal: 600000,
    story:
      "Baba Tunde had emergency hip surgery after a fall. The family has covered the deposit but the balance must be cleared before he can be discharged.",
    biller: "University College Hospital, Ibadan",
    dueDate: "2026-11-30",
    imageUrl: img("photo-1519494026892-80bbd2d6fd0d"),
    requesterName: "Kemi A.",
    donorCount: 96,
    status: "approved",
  }),
  make({
    id: "sample-lagos-rent-mum",
    title: "Rent for a single mum of three",
    category: "Housing",
    city: "Lagos",
    raised: 90000,
    goal: 350000,
    story:
      "Ngozi sells foodstuff in Mushin and supports three children alone. Her landlord needs the yearly rent by month end or the family must move out.",
    biller: "Adeyemi Properties Ltd",
    dueDate: "2026-12-01",
    imageUrl: img("photo-1560448204-e02f11c3d0e2"),
    requesterName: "Ngozi E.",
    donorCount: 18,
    status: "approved",
  }),
  make({
    id: "sample-abuja-electricity",
    title: "Electricity arrears for a home clinic",
    category: "Utilities",
    city: "Abuja",
    raised: 36500,
    goal: 120000,
    story:
      "A retired nurse runs a small evening clinic from her home in Kubwa. Unpaid electricity arrears mean the fridge storing vaccines may be disconnected.",
    biller: "Abuja Electricity Distribution Company",
    dueDate: "2026-11-25",
    imageUrl: img("photo-1473341304170-971dccb5ac1e"),
    requesterName: "Mrs. Bello",
    donorCount: 11,
    status: "approved",
  }),
  make({
    id: "sample-kano-wassce-fees",
    title: "WAESC exam fees for twin brothers",
    category: "Education",
    city: "Kano",
    raised: 12000,
    goal: 64000,
    story:
      "Usman and Hassan are top of their class but their family cannot cover both registration fees for the upcoming WAEC exams.",
    biller: "Government Secondary School, Kano",
    dueDate: "2027-01-10",
    imageUrl: img("photo-1427504494785-3a9ca7044f45"),
    requesterName: "Aisha U.",
    donorCount: null,
    status: "pending",
  }),
];

/** Approved samples — the ones shown on the discovery deck. */
export const liveSampleBills: SampleBill[] = sampleBills.filter((b) => b.status === "approved");

/** Pending samples (awaiting review). */
export const pendingSampleBills: SampleBill[] = sampleBills.filter((b) => b.status === "pending");

export function isSampleBillId(id: string): boolean {
  return id.startsWith("sample-");
}

export function getSampleBill(id: string): SampleBill | null {
  return sampleBills.find((b) => b.id === id) ?? null;
}

/** Aliases for older consumers. */
export const findSampleBill = getSampleBill;
export const getSampleBillById = getSampleBill;
