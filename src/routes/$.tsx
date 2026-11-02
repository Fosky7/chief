import { createFileRoute } from "@tanstack/react-router";

import { NotFoundPage } from "@/routes/not-found";

/**
 * Catch-all route ("/$").
 *
 * Every address the app cannot resolve lands on the missing-request page —
 * notably `/recipients/unknown-id`, which has no matching verified request.
 * The donor always gets an explanation plus a way back into the queue instead
 * of a blank screen.
 */
export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});

export default NotFoundPage;
