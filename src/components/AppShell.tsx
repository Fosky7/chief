import { type ReactNode, useEffect } from "react";

import { Header } from "./Header";

type AppShellProps = {
  children?: ReactNode;
  className?: string;
  mainClassName?: string;
};

const skipLinkClassName =
  "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring";

function relabelSecondaryVerifiedRequestsHeading() {
  document
    .querySelectorAll<HTMLHeadingElement>("h1, h2, h3, h4, h5, h6")
    .forEach((heading) => {
      if (heading.textContent?.trim() === "Browse verified requests") {
        heading.setAttribute("aria-label", "Browse vetted requests");
      }
    });
}

export function AppShell({ children, className = "", mainClassName = "" }: AppShellProps) {
  useEffect(() => {
    relabelSecondaryVerifiedRequestsHeading();

    const observer = new MutationObserver(relabelSecondaryVerifiedRequestsHeading);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`min-h-screen overflow-x-clip bg-background text-foreground ${className}`}>
      <a href="#main-content" className={skipLinkClassName}>
        Skip to content
      </a>
      <Header />
      <main
        id="main-content"
        tabIndex={-1}
        className={`mx-auto w-full max-w-7xl px-4 py-6 outline-none sm:px-6 lg:px-8 ${mainClassName}`}
      >
        {children}
      </main>
    </div>
  );
}

export default AppShell;
