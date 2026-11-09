import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { formatNaira } from '@/lib/currency'

export const Route = createFileRoute('/dashboard')({
  head: () => ({ meta: [{ title: 'Dashboard - KrossBuild' }] }),
  component: DashboardPage,
})

type Donation = {
  id?: string
  bill_id?: string
  amount?: number
  created_at?: string
  [key: string]: unknown
}

type Bill = {
  id: string
  title?: string
  amount?: number
  target_amount?: number
  raised_amount?: number
}

function DashboardPage() {
  const [email, setEmail] = useState('')
  const [donations, setDonations] = useState<Donation[]>([])
  const [bills, setBills] = useState<Record<string, Bill>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!active) return
      if (!user) {
        setLoading(false)
        return
      }
      setEmail(user.email ?? '')

      let query = await supabase.from('donations').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (query.error && /user_id|donor_id|column/i.test(query.error.message)) {
        query = await supabase.from('donations').select('*').eq('donor_id', user.id).order('created_at', { ascending: false })
      }

      if (!active) return
      if (query.error) setError(query.error.message)
      const rows = (query.data as Donation[]) ?? []
      setDonations(rows)

      const ids = Array.from(new Set(rows.map((row) => row.bill_id).filter(Boolean))) as string[]
      if (ids.length > 0) {
        const { data: billRows } = await supabase.from('bills').select('*').in('id', ids)
        const map: Record<string, Bill> = {}
        for (const row of (billRows as Bill[]) ?? []) map[row.id] = row
        if (active) setBills(map)
      }
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const total = donations.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

  if (loading) {
    return <main className='mx-auto max-w-4xl px-4 py-10 text-sm text-slate-600'>Loading dashboard...</main>
  }

  if (!email) {
    return (
      <main className='mx-auto max-w-4xl px-4 py-10'>
        <h1 className='text-3xl font-semibold'>Your dashboard</h1>
        <p className='mt-3 text-slate-600'>
          <Link to='/auth' className='underline'>Sign in</Link> to view your donations and bill activity.
        </p>
      </main>
    )
  }

  return (
    <main className='mx-auto max-w-4xl px-4 py-10'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold'>Your dashboard</h1>
          <p className='mt-2 text-sm text-slate-600'>Signed in as {email}</p>
        </div>
        <Link to='/discover' className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white'>Discover bills</Link>
      </div>

      {error ? <p className='mt-4 text-sm text-red-600'>{error}</p> : null}

      <section className='mt-8 grid gap-3 sm:grid-cols-2'>
        <div className='rounded-2xl border bg-white p-5 shadow-sm'>
          <p className='text-xs uppercase text-slate-500'>Total donated</p>
          <p className='mt-1 text-2xl font-semibold'>{formatNaira(total)}</p>
        </div>
        <div className='rounded-2xl border bg-white p-5 shadow-sm'>
          <p className='text-xs uppercase text-slate-500'>Donations recorded</p>
          <p className='mt-1 text-2xl font-semibold'>{donations.length}</p>
        </div>
      </section>

      <section className='mt-8 rounded-2xl border bg-white p-5 shadow-sm'>
        <h2 className='text-xl font-semibold'>Recent donations</h2>
        {donations.length === 0 ? (
          <p className='mt-3 text-sm text-slate-600'>No donations yet. Open a bill to make your first donation.</p>
        ) : (
          <ul className='mt-3 divide-y'>
            {donations.map((row, index) => {
              const bill = row.bill_id ? bills[row.bill_id] : undefined
              return (
                <li key={String(row.id ?? index)} className='flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <p className='font-medium'>{String(bill?.title ?? 'Bill donation')}</p>
                    <p className='text-xs text-slate-500'>{String(row.created_at ?? '')}</p>
                  </div>
                  <span className='font-semibold'>{formatNaira(Number(row.amount ?? 0))}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
