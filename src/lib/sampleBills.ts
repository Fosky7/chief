import type { ApprovedBill } from "@/hooks/useApprovedBills";

export type BillStatus = "pending" | "approved" | "rejected" | "funded" | "paid";

/** Full bill shape used by the bill detail page. Amounts are whole naira. */
export interface BillDetail {
  id: string;
  title: string;
  story: string;
  biller: string;
  dueDate: string | null;
  goal: number;
  raised: number;
  status: BillStatus;
  category: string;
  city: string;
  imageUrl: string | null;
  requesterName: string;
  donorCount: number;
}

/**
 * Sample bills shown in the discover deck when the live backend has no
 * approved bills yet (or is unreachable).
 */
export const SAMPLE_BILLS: ApprovedBill[] = [
  {
    id: "sample-ada-school-fees",
    title: "Ada's final-year school fees",
    story: "Ada is one semester away from graduating in Computer Science. Help her finish strong.",
    category: "Education",
    city: "Enugu",
    biller: "University of Nigeria, Nsukka",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
    goal: 250000,
    raised: 185000,
    needed: 65000,
    dueDate: null,
    isSample: true,
  },
  {
    id: "sample-baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    story: "Baba Tunde had emergency surgery and the hospital is holding his discharge until the bill is settled.",
    category: "Health",
    city: "Ibadan",
    biller: "University College Hospital",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
    goal: 600000,
    raised: 420000,
    needed: 180000,
    dueDate: null,
    isSample: true,
  },
  {
    id: "sample-lagos-rent",
    title: "Rent for a single mum of three",
    story: "Chioma lost her job this year and is three months behind on rent for her family's flat.",
    category: "Housing",
    city: "Lagos",
    biller: "Landlord via verified agent",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
    goal: 350000,
    raised: 90000,
    needed: 260000,
    dueDate: null,
    isSample: true,
  },
  {
    id: "sample-abuja-electricity",
    title: "Clinic electricity arrears",
    story: "A small community clinic needs its power restored to keep vaccines refrigerated.",
    category: "Utilities",
    city: "Abuja",
    biller: "Abuja Electricity Distribution Company",
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=70",
    goal: 120000,
    raised: 30000,
    needed: 90000,
    dueDate: null,
    isSample: true,
  },
];

// Kept: still used by the bill detail page.
export const sampleBills: BillDetail[] = [
  {
    id: "ada-school-fees",
    title: "Ada's final-year school fees",
    story:
      "Ada is a final-year Microbiology student at the University of Nigeria, Nsukka. Her father lost his job at a bottling plant last year and the family has kept her in school by selling foodstuff at Ogbete market. She needs to clear her final-year fees before the exam registration portal closes so she can sit her finals and graduate with her class.",
    biller: "University of Nigeria, Nsukka — Bursary",
    dueDate: "2025-12-15",
    goal: 250000,
    raised: 185000,
    status: "approved",
    category: "Education",
    city: "Enugu",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=70",
    requesterName: "Adaeze O.",
    donorCount: 47,
  },
  {
    id: "baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    story:
      "Baba Tunde, 68, had emergency prostate surgery at UCH Ibadan. The surgery went well but the family cannot pay the outstanding balance, and the hospital will not release his discharge papers until the bill is settled. His children have contributed what they can; this covers the remaining balance.",
    biller: "University College Hospital, Ibadan",
    dueDate: "2025-11-30",
    goal: 600000,
    raised: 420000,
    status: "approved",
    category: "Health",
    city: "Ibadan",
    imageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=70",
    requesterName: "Bisi A.",
    donorCount: 112,
  },
  {
    id: "single-mum-rent",
    title: "Rent for a single mum of three",
    story:
      "Chioma is a hairdresser raising three children in Ikorodu. A flood damaged her shop equipment in July and she fell behind on rent. Her landlord has given her until the end of the month to pay a year's rent or leave. Paying this keeps her children in their home and close to their school.",
    biller: "Adewale & Sons Property Managers",
    dueDate: "2025-12-31",
    goal: 350000,
    raised: 90000,
    status: "approved",
    category: "Housing",
    city: "Lagos",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=70",
    requesterName: "Chioma E.",
    donorCount: 21,
  },
  {
    id: "clinic-electricity",
    title: "Prepaid electricity for a clinic",
    story:
      "Hope Community Clinic in Kano runs a small maternity ward and vaccine fridge on prepaid power. With fuel prices up, the generator is no longer affordable. Three months of prepaid units keeps the fridge cold and the delivery room lit at night.",
    biller: "Kano Electricity Distribution Company (KEDCO)",
    dueDate: "2025-12-05",
    goal: 120000,
    raised: 40000,
    status: "approved",
    category: "Utilities",
    city: "Kano",
    imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=70",
    requesterName: "Hope Community Clinic",
    donorCount: 9,
  },
  {
    id: "solar-pump-kaduna",
    title: "Water borehole repair for Kafanchan school",
    story:
      "The borehole at LEA Primary School, Kafanchan, broke down in September. Over 400 pupils now walk to a stream to fetch water before classes. A local contractor has quoted the pump replacement and the head teacher has submitted the invoice for review.",
    biller: "Gidan Ruwa Borehole Services Ltd",
    dueDate: "2026-01-20",
    goal: 480000,
    raised: 0,
    status: "pending",
    category: "Utilities",
    city: "Kaduna",
    imageUrl: "https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=1200&q=70",
    requesterName: "Mrs. Hauwa D.",
    donorCount: 0,
  },
];

export function getSampleBill(id: string): BillDetail | null {
  return sampleBills.find((b) => b.id === id) ?? null;
}

/** Only approved (live) bills are listed publicly. */
export function listApprovedSampleBills(): BillDetail[] {
  return sampleBills.filter((b) => b.status === "approved");
}
