import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Layout } from '@/components/Layout'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'Chief' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
