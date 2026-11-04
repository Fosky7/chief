import type { ReactNode } from "react";
import { NavBar } from "@/components/NavBar";
import { ChiefLogo } from "@/components/ChiefLogo";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <NavBar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span className="flex items-center gap-2" data-testid="footer-brand">
            <ChiefLogo className="h-5 w-5" decorative />
            <span>© {new Date().getFullYear()} Chief. Every bill is reviewed before it goes live.</span>
          </span>
          <span>Payments secured by Paystack.</span>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
