import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Chief — Home' }] }),
  component: HomePage,
})

function HomePage() {
  return (
    <main data-testid="home-page" className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Chief</h1>
      <p className="text-sm text-muted-foreground">
        Discover bills, back what matters, and track progress in one place.
      </p>
      <Link
        to="/discover"
        className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
      >
        Start discovering
      </Link>
    </main>
  )
}
