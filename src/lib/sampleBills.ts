/**
 * Curated, realistic sample bills used as the fallback feed for the swipe deck
 * when the backend has no approved bills yet (or is unreachable).
 *
 * The shape mirrors the fields the deck renders so the UI never has to branch
 * on where a bill came from.
 */

export type BillStatus = "approved" | "pending";

export type BillDetail = {
  id: string;
  title: string;
  category: string;
  city: string;
  /** One-line description shown on the swipe card. */
  summary: string;
  /** Longer narrative shown on the bill detail page. */
  story: string;
  biller: string;
  imageUrl: string;
  /** Amount needed to fully fund the bill, in whole Naira. */
  goal: number;
  /** Amount already raised, in whole Naira. */
  raised: number;
  /** ISO date string. */
  dueDate: string;
  donorCount: number;
  requesterName: string;
  status: BillStatus;
};

/** Alias kept for consumers that refer to the sample shape as `SampleBill`. */
export type SampleBill = BillDetail;

export const sampleBills: SampleBill[] = [
  {
    id: "sample-rent-yaba",
    title: "Two months' rent for the Okafor family",
    category: "Rent",
    city: "Yaba, Lagos",
    summary:
      "A widow raising three children needs help clearing two months of back rent before the landlord serves notice.",
    story:
      "Mrs. Okafor lost her tailoring job in March and has been selling akara to keep the children in school.\n\nThe family has lived in the same compound for eleven years. Her landlord has agreed to hold off on eviction if the outstanding two months are cleared before the end of the month.\n\nWe verified the tenancy agreement and spoke directly with the landlord.",
    biller: "Okafor Family Tenancy",
    imageUrl:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    goal: 480000,
    raised: 125000,
    dueDate: "2025-02-28",
    donorCount: 14,
    requesterName: "Ada Okafor",
    status: "approved",
  },
  {
    id: "sample-school-kaduna",
    title: "School fees for three siblings in Kaduna",
    category: "School",
    city: "Kaduna",
    summary:
      "Term fees for three siblings whose father was hospitalised and could not work this term.",
    story:
      "The Bello children attend a community secondary school in Kaduna. Their father had surgery in January and the family used the term's savings to cover the hospital bill.\n\nThe school has confirmed the outstanding balance and agreed to keep the children in class while the balance is settled.",
    biller: "Government Day Secondary School, Kaduna",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
    goal: 235000,
    raised: 90000,
    dueDate: "2025-03-14",
    donorCount: 9,
    requesterName: "Musa Bello",
    status: "approved",
  },
  {
    id: "sample-hospital-enugu",
    title: "Surgery support for a mother in Enugu",
    category: "Hospital",
    city: "Enugu",
    summary:
      "A caesarean section bill at a teaching hospital, verified directly with the hospital's billing desk.",
    story:
      "Chinelo delivered twins by emergency caesarean section last week. The hospital has released the invoice and the family has paid part of the bill.\n\nThis bill covers the remaining balance only, paid directly to the hospital.",
    biller: "University of Nigeria Teaching Hospital",
    imageUrl:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    goal: 850000,
    raised: 410000,
    dueDate: "2025-02-20",
    donorCount: 32,
    requesterName: "Chinelo Eze",
    status: "approved",
  },
  {
    id: "sample-utility-ibadan",
    title: "Prepaid electricity for a tailoring shop",
    category: "Utility",
    city: "Ibadan",
    summary:
      "Six months of prepaid electricity so a small tailoring shop can keep its machines running.",
    story:
      "Funmi runs a one-woman tailoring shop behind Bodija market. Her two industrial machines have been idle for a week since her meter ran out.\n\nWe confirmed the meter number and the shop's registration with the local traders' association.",
    biller: "Ibadan Electricity Distribution Company",
    imageUrl:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
    goal: 62000,
    raised: 15000,
    dueDate: "2025-03-02",
    donorCount: 5,
    requesterName: "Funmi Adebayo",
    status: "approved",
  },
  {
    id: "sample-rent-abuja",
    title: "Rent deposit for a nurse relocating to Abuja",
    category: "Rent",
    city: "Gwagwalada, Abuja",
    summary:
      "A newly hired nurse needs a deposit to secure accommodation close to her new hospital posting.",
    story:
      "Grace accepted a nursing role at a hospital in Gwagwalada and starts next month. She needs the deposit to secure a room within walking distance of her shift.\n\nHer employment letter and the agent's tenancy schedule have both been verified.",
    biller: "Gwagwalada Property Agents",
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    goal: 395000,
    raised: 210000,
    dueDate: "2025-03-21",
    donorCount: 18,
    requesterName: "Grace Nwosu",
    status: "approved",
  },
  {
    id: "sample-school-lagos",
    title: "Final year exam fees for a bright student",
    category: "School",
    city: "Surulere, Lagos",
    summary:
      "WAEC and mock fees for a top student whose sponsor passed away last term.",
    story:
      "Tolu has been the top student in her class for three sessions. Her sponsor passed away last term and the family cannot cover the registration fees before the deadline.\n\nThe school bursar has provided a fee schedule confirming the exact amount.",
    biller: "Surulere Model College",
    imageUrl:
      "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&w=1200&q=80",
    goal: 128000,
    raised: 47000,
    dueDate: "2025-04-04",
    donorCount: 7,
    requesterName: "Tolu Ajayi",
    status: "approved",
  },
];

/** Unique categories present in the sample feed, for filter chips. */
export const SAMPLE_BILL_CATEGORIES: string[] = Array.from(
  new Set(sampleBills.map((bill) => bill.category)),
);

/** Looks up a sample bill by id (used when the backend row is unavailable). */
export function findSampleBill(id: string): SampleBill | undefined {
  return sampleBills.find((bill) => bill.id === id);
}

export default sampleBills;

// Kept: still used by other files.
export function getSampleBill(id: string): BillDetail | null {
  return sampleBills.find((b) => b.id === id) ?? null;
}

/** Only approved (live) bills are listed publicly. */
