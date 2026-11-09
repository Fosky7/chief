import { useEffect, useState, type ReactNode, type SVGProps } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

function ChiefLogo({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      data-testid="chief-logo"
      className={className}
      {...rest}
    >
      <path d="M2.5 8.6 12 4.1l9.5 4.5-9.5 4.4L2.5 8.6Z" fill="currentColor" />
      <path
        d="M6.2 10.9v4.2c0 1.8 2.6 3 5.8 3s5.8-1.2 5.8-3v-4.2l-1.9.9v3.1c0 .7-1.7 1.4-3.9 1.4s-3.9-.7-3.9-1.4v-3.1l-1.9-.9Z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  )
}

export function Layout({ children }: { children?: ReactNode }) {
  const { isAuthenticated, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            to="/"
            data-testid="brand-link"
            aria-label="Chief home"
            onClick={closeMenu}
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground"
          >
            <ChiefLogo className="h-7 w-7 text-primary" />
            <span>Chief</span>
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-6 text-sm md:flex">
            <Link
              to="/discover"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Discover
            </Link>
            <Link
              to="/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
              >
                Sign in
              </Link>
            )}
          </nav>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="border-t border-border bg-background md:hidden">
            <nav
              aria-label="Mobile"
              className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3 text-sm"
            >
              <Link
                to="/discover"
                onClick={closeMenu}
                className="rounded-lg px-2 py-2 text-foreground transition-colors hover:bg-muted"
              >
                Discover
              </Link>
              <Link
                to="/dashboard"
                onClick={closeMenu}
                className="rounded-lg px-2 py-2 text-foreground transition-colors hover:bg-muted"
              >
                Dashboard
              </Link>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    void signOut()
                  }}
                  className="rounded-lg px-2 py-2 text-left text-foreground transition-colors hover:bg-muted"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={closeMenu}
                  className="rounded-lg px-2 py-2 text-foreground transition-colors hover:bg-muted"
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer
        data-testid="footer-brand"
        className="border-t border-border bg-background"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <ChiefLogo aria-hidden="true" className="h-5 w-5 text-primary" />
            <span>© {new Date().getFullYear()} Chief. All rights reserved.</span>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Payments secured by Paystack
          </span>
        </div>
      </footer>
    </div>
  )
}

export default Layout
