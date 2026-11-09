import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

export function Layout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold tracking-tight">
            Chief
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
              Home
            </Link>
            <Link to="/discover" className="text-muted-foreground transition-colors hover:text-foreground">
              Discover
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  )
}
