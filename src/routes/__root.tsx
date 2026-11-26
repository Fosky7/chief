import { Component, type ReactNode } from "react";
import { RouteHead as KrossRouteHead } from "@/components/RouteHead";
import { Outlet, createRootRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { NotFoundView } from "@/routes/not-found";
import "../contrast-fix.css";

/**
 * Isolates the exclusive side-effect component (<RouteHead />) that writes
 * document head metadata. It renders nothing visible, so if it ever throws,
 * catching it here keeps every page painting instead of unmounting the
 * application into a blank screen. It is rendered as a SIBLING of the page
 * shell (never inside it) so a failure in one can never take out the other.
 */
class HeadBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[root] head metadata failed", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Shell boundary: catches a render failure coming from the shared chrome
 * (header / nav / footer) which sits outside the router's per-route catch
 * boundary. Without it one bad render in the chrome unmounts the whole tree and
 * every address paints a blank white screen. The fallback still supplies the
 * real "Main" navigation landmark and a visible heading, so the visitor always
 * gets the brand shell and a way home.
 */
class ShellBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[root] shell failed to render", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <header className="sticky top-0 z-[60] px-3 pt-3 md:px-4">
          <nav
            aria-label="Main"
            className="mx-auto flex h-16 max-w-6xl items-center rounded-full border border-border/70 bg-background/85 px-4 backdrop-blur-xl"
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-full text-xl font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
            >
              Chief
            </a>
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-20 text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">Welcome to Chief</h1>
          <p className="mt-3 text-muted-foreground">
            We could not finish drawing this page. Everything else still works.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-full border border-primary/30 px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            Go home
          </a>
        </main>
      </div>
    );
  }
}

/**
 * Page boundary: a single page's render failure must never blank the whole
 * document. The shared chrome (header, navigation, footer) keeps painting and
 * the visitor gets a real heading plus a way home.
 */
class PageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[root] page failed to render", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Something went wrong</h1>
        <p role="alert" className="mt-3 text-muted-foreground">
          This page could not be drawn. The rest of Chief still works.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full border border-primary/30 px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Back to home
        </a>
      </section>
    );
  }
}

// Root route: child routes are registered in src/routeTree.gen.ts.
// Styles are loaded by src/main.tsx (client SPA mounted into #root).
// NOTE: The real document head tags (title, favicon, meta) live statically in
// index.html. The head() below mirrors them so the two never disagree.
export const Route = createRootRoute({
  // /create-bill is a friendly alias for the bill submission form.
  beforeLoad: ({ location }) => {
    const path = location.pathname.replace(/\/+$/, "");
    if (path === "/create-bill") {
      throw redirect({ to: "/bills/new", replace: true });
    }
    // Legacy sign-in aliases always land on the canonical /auth page.
    if (path === "/signin" || path === "/sign-in") {
      throw redirect({ to: "/auth", replace: true });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Chief — Pay a bill with a swipe" },
      {
        name: "description",
        content: "Swipe through verified bills and help real people pay rent, school fees and hospital bills.",
      },
      { name: "application-name", content: "Chief" },
      { property: "og:site_name", content: "Chief" },
      { property: "og:title", content: "Chief" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: RootErrorComponent,
});

/**
 * App shell for every matched route. The page content is rendered inside
 * <Layout> so the layout itself can never be rendered twice.
 *
 * <Outlet /> is rendered unconditionally: an empty outlet must still paint the
 * chrome (header, navigation, footer) instead of an empty screen.
 *
 * <RouteHead /> is a sibling of the shell, wrapped in its own boundary, so a
 * head-metadata problem can never unmount the page content (and vice versa).
 */
function RootComponent() {
  return (
    <ShellBoundary>
      <HeadBoundary>
        <KrossRouteHead
          fallbackTitle="Chief"
          notFoundTitle="Page not found — Chief"
          notFoundDescription="The Chief page you requested does not exist or has moved."
        />
      </HeadBoundary>
      <Layout>
        <PageBoundary>
          <Outlet />
        </PageBoundary>
      </Layout>
    </ShellBoundary>
  );
}

/**
 * Last-resort boundary for the whole app. Without it an unexpected render
 * error unmounts the entire tree and every address shows a blank white page;
 * with it the visitor still gets the brand header, a heading and a way home.
 * It deliberately renders no shared components so it can never fail itself.
 */
function RootErrorComponent({ error }: { error?: unknown }) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Something unexpected happened while loading this page.";

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-[60] px-3 pt-3 md:px-4">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-6xl items-center rounded-full border border-border/70 bg-background/85 px-4 backdrop-blur-xl"
        >
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full text-xl font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          >
            Chief
          </a>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Something went wrong</h1>
        <p role="alert" className="mt-3 text-muted-foreground">
          {message}
        </p>
        <a
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full border border-primary/30 px-6 py-3 text-base font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Back to home
        </a>
      </main>
    </div>
  );
}

/**
 * Fallback for any URL that does not match a registered route. Uses the shared
 * branded view and keeps the long-standing "Go home" action label.
 * The root-level fallback renders outside RootComponent, so it supplies
 * <Layout> itself.
 */
function NotFound() {
  return (
    <Layout>
      <NotFoundView homeLabel="Go home" />
    </Layout>
  );
}
