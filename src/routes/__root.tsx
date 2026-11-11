import { Outlet, createRootRoute, redirect } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { GradientButton } from "@/components/ui/brand";

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
