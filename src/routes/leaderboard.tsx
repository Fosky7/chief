import { createFileRoute } from "@tanstack/react-router";

import LeaderboardPage from "@/pages/LeaderboardPage";

/**
 * Public /leaderboard route.
 *
 * The page is intentionally not registered in the shared navigation config; its
 * only entry points are the home page menu dropdown and the site footer.
 *
 * This route declares its own head() metadata so the leaderboard never reuses
 * another page's title/description in the browser tab or in link previews.
 * Nothing visible on the page changes.
 */
const LEADERBOARD_TITLE = "Top givers leaderboard — Chief";
const LEADERBOARD_DESCRIPTION =
  "See the top 100 givers on Chief, ranked by the total amount they have donated to verified rent, school fees and hospital bills.";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: LEADERBOARD_TITLE },
      { name: "description", content: LEADERBOARD_DESCRIPTION },
      { property: "og:title", content: LEADERBOARD_TITLE },
      { property: "og:description", content: LEADERBOARD_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});
