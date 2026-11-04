import type { ReactNode } from "react";
import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import appCss from "../styles.css?url";

// Root route: child routes are registered in src/routeTree.gen.ts.
export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Chief — Pay a bill with a swipe" },
      {
        name: "description",
        content: "Swipe through verified bills and help real people pay rent, school fees and hospital bills.",
      },
      { property: "og:title", content: "Chief" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

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
