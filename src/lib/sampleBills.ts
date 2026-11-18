/**
 * Sample bills shown on the discover deck when no approved bills exist yet
 * (or the backend is unreachable). All amounts are in naira and are >= ₦1,000
 * so they always render with a thousands separator.
 */
export type SampleBill = {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  goal: number;
  raised: number;
  image: string;
};

export const sampleBills: SampleBill[] = [
  {
    id: "sample-ada-school-fees",
    title: "Ada's final-year school fees",
    description: "Ada is one semester away from her nursing degree at UNN. Help her clear her final fees.",
    category: "Education",
    city: "Enugu",
    goal: 250000,
    raised: 185000,
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "sample-baba-tunde-hospital",
    title: "Baba Tunde's hospital bill",
    description: "Baba Tunde needs to settle his surgery bill at UCH Ibadan before discharge.",
    category: "Health",
    city: "Ibadan",
    goal: 600000,
    raised: 420000,
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "sample-lagos-rent",
    title: "Rent for a single mum of three",
    description: "Chioma's annual rent is due next month. Help keep her family in their home in Yaba.",
    category: "Housing",
    city: "Lagos",
    goal: 350000,
    raised: 90000,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "sample-abuja-electricity",
    title: "Electricity arrears for a home clinic",
    description: "Nurse Fatima runs a small home clinic in Kubwa. Her prepaid meter has been cut off over arrears.",
    category: "Utilities",
    city: "Abuja",
    goal: 120000,
    raised: 45000,
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=70",
  },
  {
    id: "sample-ph-waec",
    title: "WAEC registration for twins",
    description: "Twins Ebuka and Ebube need their WAEC registration paid before the deadline.",
    category: "Education",
    city: "Port Harcourt",
    goal: 80000,
    raised: 12500,
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=70",
  },
];

export function getSampleBill(id: string): SampleBill | undefined {
  return sampleBills.find((b) => b.id === id);
}

export default sampleBills;
