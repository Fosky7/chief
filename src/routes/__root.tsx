import { Outlet, Link, createRootRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

// Root route: child routes are registered in src/routeTree.gen.ts.
// Styles are loaded by src/main.tsx (client SPA mounted into #root).
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Chief — Pay a bill with a swipe" },
      {
        name: "description",
        content: "Chief: swipe through verified bills and help real people pay rent, school fees and hospital bills.",
      },
      { name: "application-name", content: "Chief" },
      { name: "apple-mobile-web-app-title", content: "Chief" },
      { property: "og:title", content: "Chief" },
      { property: "og:site_name", content: "Chief" },
      {
        property: "og:description",
        content: "Swipe right to pay a verified bill for someone in Nigeria.",
      },
    ],
    links: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
  }),
  component: RootComponent,
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
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-4xl font-bold">Page not found</h1>
        <p className="mt-3 text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground">
          Go home
        </Link>
      </div>
    </Layout>
  );
}
