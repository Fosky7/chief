import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { liveSampleBills } from "@/lib/sampleBills";

/** Categories the design system already ships badges and accents for. */
export type BillCategory = "Education" | "Health" | "Housing" | "Utilities";

const KNOWN_CATEGORIES: readonly BillCategory[] = [
  "Education",
  "Health",
  "Housing",
  "Utilities",
] as const;

const DEFAULT_CATEGORY: BillCategory = "Utilities";

/**
 * Curated photo per category. Used whenever a bill row has no usable photo so
 * every swipe card keeps the same layout (no empty media box, no layout shift).
 */
const CATEGORY_FALLBACK_IMAGES: Record<BillCategory, string> = {
  Education:
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=70",
  Health:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1000&q=70",
  Housing:
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=70",
  Utilities:
    "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1000&q=70",
};

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=70";

/** A bill shaped for the swipe deck: one flat, always-populated object. */
export interface ApprovedBill {
  id: string;
  title: string;
  category: BillCategory;
  city: string;
  story: string;
  /** Amount already raised, in Naira. */
  raised: number;
  /** Total amount the bill needs, in Naira (always >= raised and >= 1). */
  goal: number;
  /** Always a usable URL — remote photo when available, category fallback otherwise. */
  imageUrl: string;
  status: string;
}

export interface UseApprovedBillsResult {
  bills: ApprovedBill[];
  loading: boolean;
  error: string | null;
  /** "remote" when the live approved bills were read, "fallback" for curated data. */
  source: "remote" | "fallback";
  refresh: () => Promise<void>;
}

/** Money the bill still needs. Never negative so the CTA copy stays valid. */
export function billNeededAmount(bill: Pick<ApprovedBill, "raised" | "goal">): number {
  return Math.max(Math.round(bill.goal - bill.raised), 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumber(raw: unknown): number {
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : 0;
  }
  if (typeof raw === "string") {
    const parsed = Number(raw.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pickString(row: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function pickNumber(row: Record<string, unknown>, keys: readonly string[]): number {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      const parsed = toNumber(row[key]);
      if (Number.isFinite(parsed) && parsed !== 0) return parsed;
    }
  }
  return 0;
}

function normalizeCategory(raw: unknown): BillCategory {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const match = KNOWN_CATEGORIES.find((category) => category.toLowerCase() === value);
  return match ?? DEFAULT_CATEGORY;
}

function pickImageUrl(source: unknown, category: BillCategory): string {
  if (isRecord(source)) {
    const explicit = pickString(source, [
      "image_url",
      "imageUrl",
      "photo_url",
      "photoUrl",
      "cover_image_url",
      "image",
      "photo",
    ]);
    if (explicit) return explicit;
  }
  return CATEGORY_FALLBACK_IMAGES[category] ?? DEFAULT_FALLBACK_IMAGE;
}

/** Map an arbitrary `bills` row into the deck shape, or null when unusable. */
function mapRow(row: unknown): ApprovedBill | null {
  if (!isRecord(row)) return null;

  const id = pickString(row, ["id", "bill_id"]);
  const title = pickString(row, ["title", "name"]);
  if (!id || !title) return null;

  const category = normalizeCategory(row["category"]);
  const raised = pickNumber(row, [
    "raised",
    "raised_amount",
    "amount_raised",
    "funded_amount",
    "donated_amount",
  ]);
  const rawGoal = pickNumber(row, [
    "goal",
    "goal_amount",
    "target_amount",
    "amount_needed",
    "needed_amount",
    "amount",
  ]);

  // Goal must stay at least 1 to keep progress maths (percentage) safe.
  const goal = Math.max(rawGoal, raised, 1);

  return {
    id,
    title,
    category,
    city: pickString(row, ["city", "location"]),
    story: pickString(row, ["story", "description"]),
    raised,
    goal,
    imageUrl: pickImageUrl(row, category),
    status: pickString(row, ["status"]) || "approved",
  };
}

/** Curated, always-available deck used before live data lands or if reads fail. */
function buildFallbackBills(): ApprovedBill[] {
  return liveSampleBills.map((sample, index) => {
    const category = normalizeCategory((sample as { category?: unknown }).category);
    const raised = toNumber((sample as { raised?: unknown }).raised);
    const goal = Math.max(toNumber((sample as { goal?: unknown }).goal), raised, 1);

    return {
      id: String((sample as { id?: unknown }).id ?? `sample-${index}`),
      title: String((sample as { title?: unknown }).title ?? "Bill"),
      category,
      city: String((sample as { city?: unknown }).city ?? ""),
      story: "",
      raised,
      goal,
      imageUrl: pickImageUrl(sample, category),
      status: "approved",
    };
  });
}

/**
 * Loads approved bills for the swipe deck.
 *
 * Reads the live `bills` table through the shared Supabase client, keeps only
 * approved rows, and falls back to the curated sample deck whenever the table is
 * unreachable, empty, or blocked by row level security — the deck never renders
 * an empty screen.
 */
export function useApprovedBills(): UseApprovedBillsResult {
  const [bills, setBills] = useState<ApprovedBill[]>(() => buildFallbackBills());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"remote" | "fallback">("fallback");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const { data, error: queryError } = await supabase
        .from("bills")
        .select("*")
        .limit(60);

      if (queryError) throw queryError;

      const rows = Array.isArray(data) ? data : [];
      const approved = rows
        .map((row) => mapRow(row))
        .filter((bill): bill is ApprovedBill => bill !== null)
        .filter((bill) => bill.status.toLowerCase() === "approved");

      if (!mountedRef.current) return;

      if (approved.length > 0) {
        setBills(approved);
        setSource("remote");
      } else {
        setBills(buildFallbackBills());
        setSource("fallback");
      }
    } catch (loadError) {
      if (!mountedRef.current) return;
      // Never break the deck: show curated bills and surface a soft message.
      setBills(buildFallbackBills());
      setSource("fallback");
      setError(
        loadError instanceof Error
          ? loadError.message
          : "We couldn't load live bills right now.",
      );
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { bills, loading, error, source, refresh };
}
