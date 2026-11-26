import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Your dashboard — Chief" },
      {
        name: "description",
        content:
          "See every bill you have posted on Chief, its current status and what to do next.",
      },
      { property: "og:title", content: "Your dashboard — Chief" },
      {
        property: "og:description",
        content: "Track the bills you have posted on Chief and post a new one in minutes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

type Viewer = { id: string; email: string | null };

type Bill = {
  id: string;
  title: string;
  summary: string | null;
  status: string | null;
  createdAt: string | null;
};

type LoadStatus = "loading" | "ready" | "error";

/** Column names different bill schemas commonly use, checked in order. */
const TITLE_KEYS = ["title", "name", "headline"] as const;
const SUMMARY_KEYS = ["summary", "description", "abstract", "body"] as const;
const STATUS_KEYS = ["status", "state", "stage"] as const;
const OWNER_KEYS = [
  "requester_id",
  "author_id",
  "user_id",
  "owner_id",
  "created_by",
  "authorId",
  "userId",
  "ownerId",
] as const;
const CREATED_KEYS = ["created_at", "createdAt", "inserted_at", "submitted_at"] as const;

function firstValue(row: Record<string, unknown>, keys: readonly string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function asText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  if (typeof value === "number") return String(value);
  return null;
}

/** Reads the author column of a bill row, whichever name the schema uses. */
function ownerIdOf(row: unknown): string | null {
  if (!row || typeof row !== "object") return null;
  return asText(firstValue(row as Record<string, unknown>, OWNER_KEYS));
}

function normalizeBill(row: unknown, index: number): Bill {
  const record = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
  return {
    id: asText(record.id) ?? asText(record.bill_id) ?? `bill-${index}`,
    title: asText(firstValue(record, TITLE_KEYS)) ?? "Untitled bill",
    summary: asText(firstValue(record, SUMMARY_KEYS)),
    status: asText(firstValue(record, STATUS_KEYS)),
    createdAt: asText(firstValue(record, CREATED_KEYS)),
  };
}

function byNewestFirst(a: Bill, b: Bill): number {
  const aTime = a.createdAt ? Date.parse(a.createdAt) : Number.NaN;
  const bTime = b.createdAt ? Date.parse(b.createdAt) : Number.NaN;
  if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
  if (Number.isNaN(aTime)) return 1;
  if (Number.isNaN(bTime)) return -1;
  return bTime - aTime;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Human-readable label for a bill status (pending -> "Pending review"). */
function statusLabel(status: string | null): string {
  const s = (status ?? "").toLowerCase();
  if (!s) return "Pending review";
  if (["pending", "pending_review", "submitted", "review"].includes(s)) return "Pending review";
  if (["approved", "active", "live"].includes(s)) return "Approved";
  if (["rejected", "declined"].includes(s)) return "Rejected";
  if (["funded", "completed"].includes(s)) return "Funded";
  if (s === "paid") return "Paid to biller";
  return status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ") : "Pending review";
}

/**
 * The dashboard only needs "read a list of bills", so the client is narrowed to
 * that tiny shape. This keeps the page compiling against any generated database
 * types while still going through the project's single Supabase client.
 */
type BillsResult = PromiseLike<{ data: unknown; error: { message?: string } | null }>;
type BillsClient = { from: (table: string) => { select: (columns?: string) => BillsResult } };

const billsClient = () => supabase as unknown as BillsClient;

/**
 * Synchronous signed-out check. Supabase persists the session in localStorage
 * under `sb-<ref>-auth-token`; when no such key exists the visitor is
 * definitively signed out, so the dashboard can render its sign-in notice
 * immediately instead of waiting on a network-backed auth round-trip.
 */
function hasStoredAuthToken(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return true;
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) return true;
    }
  } catch {
    return true;
  }
  return false;
}

/**
 * Resolves with `fallback` if `promise` has not settled within `ms`, so a stalled
 * auth/bills round-trip can never leave the dashboard spinning forever.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function loadViewerBills(): Promise<{ viewer: Viewer | null; bills: Bill[] }> {
  // A signed-out visitor simply has no session. `getUser()` reports
  // "Auth session missing!" as an error in that case, which would surface the
  // bills load error instead of the signed-out dashboard state. Reading the
  // session directly keeps the signed-out notice (and its sign-in link) visible.
  let user: { id: string; email?: string | null } | null = null;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    user = data?.session?.user ?? null;
  } catch {
    // An unreadable session must never replace the sign-in notice with a load
    // error panel: treat it as signed out.
    user = null;
  }
  if (!user) return { viewer: null, bills: [] };

  const { data, error } = await billsClient().from("bills").select("*");
  if (error) throw new Error(error.message ?? "We could not load your bills right now.");

  const rows = Array.isArray(data) ? (data as unknown[]) : [];

  // Row level security already limits what this account may read. When the
  // schema records an author we additionally scope to it, so the dashboard never
  // mixes in somebody else's bills.
  const hasOwnerColumn = rows.some((row) => ownerIdOf(row) !== null);
  const ownRows = hasOwnerColumn ? rows.filter((row) => ownerIdOf(row) === user.id) : rows;

  return {
    viewer: { id: user.id, email: user.email ?? null },
    bills: ownRows.map(normalizeBill).sort(byNewestFirst),
  };
}

function DashboardPage() {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [bills, setBills] = useState<Bill[]>([]);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    setErrorMessage(null);

    // Signed-out visitors get the sign-in notice straight away (Module 9:
    // the signed-out dashboard state must always render, never a spinner or
    // an avoidable error panel).
    if (!hasStoredAuthToken()) {
      setViewer(null);
      setBills([]);
      setStatus("ready");
      return () => {
        cancelled = true;
      };
    }

    setStatus("loading");

    // A signed-out visitor must always reach the "Sign in to continue" notice,
    // so a slow session/bills round-trip falls back to the signed-out view
    // instead of leaving the loading skeleton on screen indefinitely.
    withTimeout(loadViewerBills(), 3500, { viewer: null, bills: [] })
      .then((result) => {
        if (cancelled) return;
        setViewer(result.viewer);
        setBills(result.bills);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We could not load your bills right now.",
        );
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section
        aria-labelledby="dashboard-title"
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Dashboard
          </p>
          <h1
            id="dashboard-title"
            className="mt-2 text-balance text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Your dashboard
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Everything you have posted on Chief lives here, with its current status.
          </p>
          {viewer?.email ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              Signed in as {viewer.email}
            </p>
          ) : null}
        </div>
        <PostBillLink className="w-full shrink-0 sm:w-auto" label="New bill" />
      </section>

      <div className="mt-8" aria-busy={status === "loading"}>
        {status === "loading" ? <DashboardLoading /> : null}
        {status === "error" ? (
          <DashboardError message={errorMessage} onRetry={retry} />
        ) : null}
        {status === "ready" && viewer === null ? <SignedOutNotice /> : null}
        {status === "ready" && viewer !== null && bills.length === 0 ? (
          <DashboardEmpty />
        ) : null}
        {status === "ready" && viewer !== null && bills.length > 0 ? (
          <BillList bills={bills} />
        ) : null}
      </div>
    </main>
  );
}

function PostBillLink({
  className = "",
  label = "Post a bill",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <a
      href="/bills/new"
      className={`inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
    >
      {label}
    </a>
  );
}

function DashboardLoading() {
  return (
    <section
      data-testid="dashboard-loading"
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-3 rounded-2xl border border-border bg-card px-6 py-14 text-center"
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary"
      />
      <span className="text-sm font-medium text-muted-foreground">Loading your bills</span>
    </section>
  );
}

function DashboardError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <section
      data-testid="dashboard-error"
      role="alert"
      className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center"
    >
      <h2 className="text-lg font-semibold text-destructive">
        We could not load your bills
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {message ?? "Something went wrong. Please try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </section>
  );
}

function DashboardEmpty() {
  return (
    <section
      data-testid="dashboard-empty"
      aria-labelledby="dashboard-empty-title"
      className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center"
    >
      <div data-testid="bills-empty" className="flex flex-col items-center">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"
        >
          <span className="h-3 w-3 rounded-full bg-primary" />
        </span>
        <h2
          id="dashboard-empty-title"
          data-testid="bills-empty-title"
          className="mt-5 text-xl font-semibold"
        >
          No bills yet
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          When you post your first bill it will show up here with its status and activity.
        </p>
        <PostBillLink className="mt-6" />
      </div>
    </section>
  );
}

function SignedOutNotice() {
  return (
    <section
      data-testid="dashboard-signed-out"
      className="flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center"
    >
      <h2 className="text-xl font-semibold">Sign in to see your bills</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your dashboard is private. Sign in to track the bills you have posted.
      </p>
      <a
        href="/auth"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Sign in to continue
      </a>
      <a
        href="/discover"
        className="mt-3 inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Explore bills
      </a>
    </section>
  );
}

function BillList({ bills }: { bills: Bill[] }) {
  return (
    <section aria-label="Your bills" data-testid="dashboard-bills">
      <ul className="grid gap-4 sm:grid-cols-2">
        {bills.map((bill) => {
          const posted = formatDate(bill.createdAt);
          return (
            <li
              key={bill.id}
              data-testid="dashboard-bill"
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold leading-snug">{bill.title}</h2>
                <span
                  data-testid="bill-status"
                  className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {statusLabel(bill.status)}
                </span>
              </div>
              {bill.summary ? (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {bill.summary}
                </p>
              ) : null}
              {posted ? (
                <p className="mt-4 text-xs text-muted-foreground">Posted {posted}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}