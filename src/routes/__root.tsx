import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Layout } from '@/components/Layout'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'Chief' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'application-name', content: 'Chief' },
      { property: 'og:site_name', content: 'Chief' },
      {
        name: 'description',
        content:
          'Chief helps you discover verified bills and support real people across Nigeria with a swipe.',
      },
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
