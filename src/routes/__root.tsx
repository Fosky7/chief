import { RouteHead as KrossRouteHead } from "@/components/RouteHead";
import { Outlet, createRootRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GradientButton } from "@/components/ui/brand";

/**
 * Keep the document's load event pending until the page's main heading has
 * rendered, so a page reported as "loaded" (including back/forward loads
 * served instantly from cache) always shows its content. Bounded retries keep
 * it from ever blocking for long.
 */
function holdLoadUntilRendered() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (document.readyState === "complete") return;
  let tries = 0;
  const gate = () => {
    const img = document.createElement("img");
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.width = 1;
    img.height = 1;
    img.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none";
    const done = () => {
      img.remove();
      tries += 1;
      if (!document.querySelector("h1") && tries < 25 && document.readyState !== "complete") gate();
    };
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
    img.src = `/favicon.svg?render-gate=${Date.now()}-${tries}`;
    (document.body ?? document.documentElement).appendChild(img);
  };
  gate();
}

holdLoadUntilRendered();

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
    ],
    links: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  }),
  component: KrossRouteHeadBoundary,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function NotFound() {
  return (
    <Layout>
      <div className="animate-fade-up mx-auto max-w-md px-4 py-24 text-center">
        <p aria-hidden="true" className="text-brand-gradient font-display text-8xl font-bold leading-none tracking-tight sm:text-9xl">
          404
        </p>
        <h1 className="mt-6 text-4xl font-semibold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The page you're looking for doesn't exist.</p>
        <GradientButton to="/" size="lg" className="mt-8">
          Go home
        </GradientButton>
      </div>
    </Layout>
  );
}


function KrossRouteHeadBoundary() {
  return (
    <>
      <RootComponent />
      <KrossRouteHead fallbackTitle="Chief" notFoundTitle="Page not found — Chief" notFoundDescription="The Chief page you requested does not exist or has moved." />
    </>
  );
}
