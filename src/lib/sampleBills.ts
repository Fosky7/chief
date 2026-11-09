/**
 * Fallback bills shown on /discover when the backend returns no approved
 * bills (or is unreachable). Shape matches what the discover deck normalizes.
 */
export type SampleBill = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  goal: number;
  raised: number;
  image: string | null;
};

export const sampleBills: SampleBill[] = [
  {
    id: "sample-ada-school-fees",
    title: "Ada's final-year school fees",
    description: "Ada needs to clear her final-year fees at UNN to sit for her exams.",
    category: "Education",
    city: "Enugu",
    goal: 250000,
    raised: 185000,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "sample-baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    description: "Surgery recovery costs at UCH Ibadan for a retired teacher.",
    category: "Health",
    city: "Ibadan",
    goal: 600000,
    raised: 420000,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "sample-single-mum-rent",
    title: "Rent for a single mum of three",
    description: "One year's rent for a two-bedroom flat in Surulere, due next month.",
    category: "Housing",
    city: "Lagos",
    goal: 350000,
    raised: 90000,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "sample-chidi-electricity",
    title: "Chidi's overdue electricity bill",
    description: "Clearing arrears so a small tailoring shop can stay powered.",
    category: "Utilities",
    city: "Port Harcourt",
    goal: 85000,
    raised: 32500,
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "sample-amina-jamb",
    title: "Amina's WAEC & JAMB registration",
    description: "Exam registration fees for a bright secondary school student in Kano.",
    category: "Education",
    city: "Kano",
    goal: 45000,
    raised: 12000,
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "sample-ngozi-dialysis",
    title: "Ngozi's dialysis sessions",
    description: "Four weeks of dialysis treatment at a teaching hospital in Abuja.",
    category: "Health",
    city: "Abuja",
    goal: 1200000,
    raised: 540000,
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=70",
  },
];

export default sampleBills;

/** Look up a sample bill by id (used by bill detail fallbacks). */
export function getSampleBill(id: string): SampleBill | null {
  return sampleBills.find((b) => b.id === id) ?? null;
}
