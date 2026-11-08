/**
 * Realistic sample bills used as a fallback when the live backend has no
 * approved bills yet (or is unreachable). Sample bills are never written to
 * the database — they only keep the discover deck populated.
 */

export type BillCategory = "Education" | "Health" | "Housing" | "Utilities";
export type BillStatus = "pending" | "approved" | "rejected" | "paid";

export interface SampleBill {
  id: string;
  title: string;
  category: BillCategory;
  city: string;
  /** Amount raised so far, in Naira. */
  raised: number;
  /** Total amount needed, in Naira. */
  goal: number;
  /** Photo URL (alias of imageUrl kept for older callers). */
  image: string;
  imageUrl: string;
  story: string;
  biller: string;
  dueDate: string | null;
  status: BillStatus;
  requesterName: string | null;
  donorCount: number | null;
}

const img = (photo: string) =>
  `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=900&q=70`;

function make(bill: Omit<SampleBill, "image">): SampleBill {
  return { ...bill, image: bill.imageUrl };
}

export const sampleBills: SampleBill[] = [
  make({
    id: "sample-dialysis-ibadan",
    title: "Urgent Help Needed: Mama Ngozi's dialysis sessions",
    category: "Health",
    city: "Ibadan",
    raised: 312500,
    goal: 780000,
    imageUrl: img("photo-1519494026892-80bbd2d6fd0d"),
    story:
      "Mama Ngozi needs three dialysis sessions every week while she waits for a kidney transplant. Her children have covered what they can, but the hospital invoice is now overdue.",
    biller: "University College Hospital, Ibadan",
    dueDate: "2026-12-15",
    status: "approved",
    requesterName: "Chinedu O.",
    donorCount: 41,
  }),
  make({
    id: "sample-school-fees-enugu",
    title: "Ada's final-year school fees",
    category: "Education",
    city: "Enugu",
    raised: 185000,
    goal: 250000,
    imageUrl: img("photo-1523050854058-8df90110c9f1"),
    story:
      "Ada is one semester away from graduating in Computer Science. Her father's shop flooded this year and the final tuition balance is blocking her exam registration.",
    biller: "University of Nigeria, Enugu Campus",
    dueDate: "2026-11-30",
    status: "approved",
    requesterName: "Ada E.",
    donorCount: 27,
  }),
  make({
    id: "sample-rent-lagos",
    title: "Rent for a single mum of three",
    category: "Housing",
    city: "Lagos",
    raised: 90000,
    goal: 350000,
    imageUrl: img("photo-1560448204-e02f11c3d0e2"),
    story:
      "Funmi sells food in Yaba and lost most of her stock during the rainy season. The landlord has asked for the annual rent by the end of the month.",
    biller: "Adeyemi Properties Ltd",
    dueDate: "2026-12-01",
    status: "approved",
    requesterName: "Funmi A.",
    donorCount: 12,
  }),
  make({
    id: "sample-electricity-kano",
    title: "Prepaid electricity for a home clinic",
    category: "Utilities",
    city: "Kano",
    raised: 48000,
    goal: 120000,
    imageUrl: img("photo-1473341304170-971dccb5ac1e"),
    story:
      "A retired nurse runs a small evening clinic from her home. Keeping the vaccine fridge powered needs a steady prepaid electricity top-up.",
    biller: "Kano Electricity Distribution Company",
    dueDate: null,
    status: "approved",
    requesterName: "Hajiya Aisha",
    donorCount: 9,
  }),
  make({
    id: "sample-surgery-abuja",
    title: "Baba Tunde's hernia surgery",
    category: "Health",
    city: "Abuja",
    raised: 420000,
    goal: 600000,
    imageUrl: img("photo-1576091160550-2173dba999ef"),
    story:
      "Baba Tunde has been in pain for months and the surgeon has scheduled the operation. The deposit is required before the theatre date can be confirmed.",
    biller: "National Hospital Abuja",
    dueDate: "2026-12-10",
    status: "approved",
    requesterName: "Tunde B.",
    donorCount: 58,
  }),
  make({
    id: "sample-water-pending",
    title: "Borehole repair for a primary school",
    category: "Utilities",
    city: "Jos",
    raised: 0,
    goal: 450000,
    imageUrl: img("photo-1541544181051-e46607bc22a4"),
    story: "The school's only borehole pump broke down and pupils now walk to fetch water.",
    biller: "Plateau Water Works",
    dueDate: null,
    status: "pending",
    requesterName: "Mr. Dung",
    donorCount: 0,
  }),
];

/** Approved sample bills that still need money — what the deck shows. */
export const liveSampleBills: SampleBill[] = sampleBills.filter(
  (b) => b.status === "approved" && b.raised < b.goal,
);

export const pendingSampleBills: SampleBill[] = sampleBills.filter((b) => b.status === "pending");

export function isSampleBillId(id: string): boolean {
  return id.startsWith("sample-");
}

export function getSampleBill(id: string): SampleBill | null {
  return sampleBills.find((b) => b.id === id) ?? null;
}

// Aliases for callers using alternative names.
export const findSampleBill = getSampleBill;
export const getSampleBillById = getSampleBill;
