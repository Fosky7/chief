import type { Recipient } from "@/types/recipient";

/**
 * Seeded recipient dataset (Module 3).
 *
 * Realistic, provider-verified bill requests for the Nigerian market. Every
 * entry carries:
 *  - a name and a `https://` portrait (rendered above the amounts),
 *  - an explicit `billType` (e.g. "Rent") shown as the card's bill-type chip,
 *  - `amount` (owed) and `stillNeeded` rendered side by side on the card,
 *  - `storySummary` — the short paragraph under "Their story",
 *  - a full `breakdown` whose line items sum to `amount`.
 *
 * Amounts are Naira integers. The array is `readonly` so nothing can mutate the
 * shared seed at runtime.
 */
export const recipients: readonly Recipient[] = [
  {
    id: "maria-alvarez",
    name: "Maria Alvarez",
    imageUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=256&q=80",
    location: "Surulere, Lagos",
    verifiedOn: "12 March 2025",
    billType: "Rent",
    category: "Rent",
    biller: "Adeyinka Properties (landlord)",
    accountNumber: "RNT-4471-2380",
    amount: 480000,
    stillNeeded: 185000,
    dueLabel: "Due 30 March 2025",
    note: "Two months behind on rent after her tailoring shop flooded in the last rainy season.",
    storySummary:
      "Maria runs a small tailoring shop in Surulere. Flood water ruined two sewing machines in June, and the repair bills pushed her two months behind on rent. The landlord has agreed to hold the eviction notice until the end of the month.",
    story:
      "Maria has rented the same two-room flat in Surulere for eleven years. She sews school uniforms and aso-ebi for her neighbours, and until this year she had never missed a rent payment. In June, a burst drainage line sent water through the ground floor of her building. Two industrial sewing machines were damaged beyond repair and a third needed a new motor. She spent her rent savings on repairs so she could keep taking orders, and the arrears built up over two months. Her landlord, Adeyinka Properties, verified the outstanding balance with us and has agreed to pause the eviction notice while neighbours help close the gap. Every naira pledged here is paid directly to the landlord's account — never to Maria.",
    breakdown: [
      { label: "March rent", description: "March rent", amount: 420000 },
      { label: "Service charge", description: "Service charge", amount: 45000 },
      { label: "Waste levy", description: "Waste levy", amount: 15000 },
    ],
  },
  {
    id: "amara-okafor",
    name: "Amara Okafor",
    imageUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
    location: "Yaba, Lagos",
    verifiedOn: "9 March 2025",
    billType: "Rent",
    category: "Rent",
    biller: "Olawale Family Homes (landlord)",
    accountNumber: "RNT-8820-1147",
    amount: 360000,
    stillNeeded: 240000,
    dueLabel: "Due 5 April 2025",
    note: "Single mother of two whose hours were cut at the market stall she manages.",
    storySummary:
      "Amara manages a fabric stall in Yaba market and raises two children on her own. Her stall's trading hours were cut in half when the market roof was repaired, and her income dropped with them. She is asking for help with one quarter's rent so the family can stay put.",
    story:
      "Amara has managed the same fabric stall in Yaba for six years. She is the only income in her household: two children, both in primary school, and a mother who needs daily care. When the market's central roof was repaired in January, trading was restricted to mornings only for nine weeks. Amara's takings fell by more than half, and the quarter's rent fell behind. The landlord has verified the balance and confirmed that the flat is not yet listed for new tenants. Amara has already paid what she could from her savings — this request covers the remainder so her children can finish the school term without moving.",
    breakdown: [
      { label: "Quarter rent", description: "Quarter rent", amount: 330000 },
      { label: "Service charge", description: "Service charge", amount: 30000 },
    ],
  },
  {
    id: "tunde-bakare",
    name: "Tunde Bakare",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    location: "Ikeja, Lagos",
    verifiedOn: "14 March 2025",
    billType: "Electricity",
    category: "Electricity",
    biller: "Ikeja Electric",
    accountNumber: "IE-4410-9925",
    amount: 62500,
    stillNeeded: 21500,
    dueLabel: "Disconnection notice — 27 March 2025",
    note: "Disconnection notice served after a hospital stay wiped out his bill budget.",
    story:
      "Tunde drives a keke napep in Ikeja and supports a wife and three children. In February he spent eleven days in hospital with malaria, and the bills consumed the money he had set aside for electricity. Ikeja Electric has verified the arrears and issued a disconnection notice for the 27th. Restoring the connection after disconnection costs considerably more than paying now, so neighbours are closing the gap before the deadline. The prepaid meter is in his name and the account number is verified.",
    storySummary:
      "Tunde drives a keke in Ikeja. Eleven days in hospital in February used up the money he had saved for electricity, and a disconnection notice is now due on the 27th.",
    breakdown: [
      {
        label: "Outstanding units",
        description: "Outstanding units",
        amount: 45000,
      },
      { label: "Fixed charge", description: "Fixed charge", amount: 8000 },
      { label: "VAT", description: "VAT", amount: 9500 },
    ],
  },
  {
    id: "nneka-eze",
    name: "Nneka Eze",
    imageUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=80",
    location: "Nsukka, Enugu",
    verifiedOn: "7 March 2025",
    billType: "School fees",
    category: "School fees",
    biller: "UNN Staff Primary School",
    accountNumber: "SCH-2025-0731",
    amount: 195000,
    stillNeeded: 90000,
    dueLabel: "Due 11 April 2025",
    note: "Term fees for three children after her husband's transport business stalled.",
    story:
      "Nneka teaches part-time at a tutorial centre in Nsukka while her husband runs a small transport business between Enugu and Abakaliki. A cracked cylinder head took his bus off the road in January and the repair has taken most of their savings. The school has verified the term's balance for all three children and confirmed that the two older pupils will not be excluded while payments are in progress. This request covers the remainder of the term so the children can sit their end-of-term examinations without interruption.",
    storySummary:
      "Nneka teaches part-time in Nsukka. A cracked cylinder head took her husband's bus off the road in January, and this term's fees for their three children are now partly unpaid.",
    breakdown: [
      { label: "Tuition", description: "Tuition", amount: 150000 },
      { label: "Textbooks", description: "Textbooks", amount: 30000 },
      { label: "Meals", description: "Meals", amount: 15000 },
    ],
  },
  {
    id: "ibrahim-sule",
    name: "Ibrahim Sule",
    imageUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    location: "Kano Municipal, Kano",
    verifiedOn: "10 March 2025",
    billType: "Water",
    category: "Water",
    biller: "Kano State Water Board",
    accountNumber: "KSW-3391-6612",
    amount: 38000,
    stillNeeded: 15000,
    dueLabel: "Due 2 April 2025",
    note: "Water board arrears after a long recovery from a leg injury kept him off work.",
    story:
      "Ibrahim repairs boreholes and hand pumps around Kano Municipal. A broken leg in November kept him off work for fourteen weeks, and without day labour his household fell behind on the water board account. He has returned to work part-time and has paid what he can from his first new contracts. The water board has verified the arrears and confirmed that the account will not be disconnected once this balance is cleared. The meter is shared with two other households in his compound, all of whom have signed the request.",
    storySummary:
      "Ibrahim repairs boreholes in Kano. Fourteen weeks off work after a broken leg left his compound's shared water account in arrears and facing disconnection.",
    breakdown: [
      { label: "Arrears", description: "Arrears", amount: 22000 },
      {
        label: "Current quarter",
        description: "Current quarter",
        amount: 11000,
      },
      { label: "Meter service", description: "Meter service", amount: 5000 },
    ],
  },
  {
    id: "bisi-adeyemi",
    name: "Bisi Adeyemi",
    imageUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    location: "Bodija, Ibadan",
    verifiedOn: "13 March 2025",
    billType: "Gas",
    category: "Gas",
    biller: "NIPCO Gas — Bodija",
    accountNumber: "GAS-7714-2208",
    amount: 47500,
    stillNeeded: 20000,
    dueLabel: "Refill booked for 29 March 2025",
    note: "Cooking gas refill and regulator for a household of six after a fire in the kitchen.",
    story:
      "Bisi cooks for a household of six in Bodija — her three children and her parents. A small kitchen fire in February damaged the gas regulator, hose and cylinder valve, and the family has been cooking on a borrowed charcoal stove since. She has saved part of the cost of a safe replacement set and asks for help with the rest. NIPCO Gas has verified the account and confirmed the refill booking for the 29th; the payment goes straight to the supplier so the equipment is installed by a certified technician.",
    storySummary:
      "Bisi cooks for six in Bodija. A small kitchen fire in February damaged the cylinder valve and regulator, and the family has been cooking on a borrowed charcoal stove since.",
    breakdown: [
      { label: "12.5kg refill", description: "12.5kg refill", amount: 38000 },
      { label: "Regulator", description: "Regulator", amount: 6000 },
      { label: "Delivery", description: "Delivery", amount: 3500 },
    ],
  },
];
