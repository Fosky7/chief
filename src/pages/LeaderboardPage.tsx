import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchLeaderboard, formatAmount, type LeaderboardEntry } from "@/lib/leaderboard";

type LoadStatus = "loading" | "ready" | "error";

/**
 * Public leaderboard: the top 100 givers, ranked by the total amount donated.
 *
 * Deliberately router-agnostic (no Link imports) so it can be mounted from the
 * file-based route without depending on generated route typings.
 */
export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const next = await fetchLeaderboard(100);
      setEntries(next);
      setStatus("ready");
    } catch (error) {
      setEntries([]);
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "Unable to load the leaderboard right now.",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const combinedTotal = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.total, 0),
    [entries],
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:pt-14">
      <section className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          Chief giving
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Leaderboard
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          The top 100 givers, ranked by the total amount they have donated to bills on Chief.
        </p>
      </section>

      {status === "loading" ? <LoadingState /> : null}

      {status === "error" ? <ErrorState message={errorMessage} onRetry={load} /> : null}

      {status === "ready" && entries.length === 0 ? <EmptyState /> : null}

      {status === "ready" && entries.length > 0 ? (
        <>
          <div className="mt-8 flex flex-col gap-1 rounded-2xl border border-border bg-card px-4 py-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-sm font-semibold text-foreground">
              {entries.length} {entries.length === 1 ? "giver" : "givers"} ranked
            </p>
            <p className="text-sm text-muted-foreground">
              {formatAmount(combinedTotal)} given between them
            </p>
          </div>

          <ol data-testid="leaderboard-list" className="mt-6 space-y-2">
            {entries.map((entry, index) => (
              <LeaderboardRow key={entry.donorId} entry={entry} rank={index + 1} />
            ))}
          </ol>
        </>
      ) : null}
    </main>
  );
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const isTopThree = rank <= 3;

  return (
    <li
      data-testid={`leaderboard-row-${rank}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 sm:gap-4 sm:px-4"
    >
      <span
        aria-label={`Rank ${rank}`}
        className={`leaderboard-rank flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isTopThree ? "leaderboard-rank-top" : ""
        }`}
      >
        {rank}
      </span>

      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-foreground">
        {entry.avatarUrl ? (
          <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          entry.initials
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="leaderboard-name truncate text-sm font-semibold sm:text-base">{entry.name}</p>
        <p className="leaderboard-meta text-xs sm:text-sm">
          {entry.donationCount} {entry.donationCount === 1 ? "donation" : "donations"}
        </p>
      </div>

      <p className="leaderboard-total shrink-0 text-sm font-bold sm:text-base">
        {formatAmount(entry.total)}
      </p>
    </li>
  );
}

function LoadingState() {
  return (
    <div data-testid="leaderboard-loading" aria-busy="true" className="mt-8 space-y-2">
      <span className="sr-only">Loading the leaderboard…</span>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      data-testid="leaderboard-empty"
      className="mt-10 rounded-2xl border border-border bg-card px-6 py-10 text-center"
    >
      <p className="text-base font-semibold text-foreground">No givers yet</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        As soon as donations start coming in, the top 100 givers will be ranked here.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
      >
        Back to home
      </a>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div
      data-testid="leaderboard-error"
      role="alert"
      className="mt-10 rounded-2xl border border-border bg-card px-6 py-10 text-center"
    >
      <p className="text-base font-semibold text-foreground">We couldn’t load the leaderboard</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {message ?? "Please try again in a moment."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}