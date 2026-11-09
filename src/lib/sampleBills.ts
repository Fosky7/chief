// Curated sample bills used when the live backend has no matching record.
// Shared by the Discover list and the bill detail page so both stay in sync.

export type BillStatus = "pending" | "approved" | "rejected" | "funded";

export interface BillDetail {
  id: string;
  title: string;
  story: string;
  biller: string;
  dueDate: string | null; // ISO date
  goal: number;
  raised: number;
  status: BillStatus;
  category: string;
  city: string;
  imageUrl: string | null;
  requesterName: string | null;
  donorCount: number | null;
}

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
export const liveSampleBills = sampleBills.filter((b) => b.status === "approved");
