import { useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { formatNaira, fundedPercent } from '@/lib/currency'

export const Route = createFileRoute('/discover')({
  head: () => ({ meta: [{ title: 'Discover bills - KrossBuild' }] }),
  component: DiscoverPage,
})

type Bill = {
  id: string
  title?: string
  description?: string
  category?: string
  amount?: number
  target_amount?: number
  raised_amount?: number
  status?: string
  created_at?: string
}

function targetOf(bill: Bill): number {
  return Number(bill.target_amount ?? bill.amount ?? 0)
}

function DiscoverPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error: queryError } = await supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })

      if (!active) return
      if (queryError) setError(queryError.message)
      setBills((data as Bill[]) ?? [])
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  return (
    <main className='mx-auto max-w-5xl px-4 py-10'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold'>Discover bills</h1>
          <p className='mt-2 text-slate-600'>Back verified community bills with transparent progress.</p>
        </div>
        <Link to='/admin' className='text-sm underline'>Admin review</Link>
      </div>

      {loading ? <p className='mt-8 text-sm text-slate-600'>Loading bills...</p> : null}
      {error ? <p className='mt-4 text-sm text-red-600'>{error}</p> : null}

      {!loading && !error && bills.length === 0 ? (
        <div className='mt-8 rounded-2xl border bg-white p-8 text-center shadow-sm'>
          <h2 className='text-xl font-semibold'>No bills found</h2>
          <p className='mt-2 text-sm text-slate-600'>New bills will appear here once they are submitted.</p>
        </div>
      ) : null}

      <div className='mt-8 grid gap-4 sm:grid-cols-2'>
        {bills.map((bill) => {
          const target = targetOf(bill)
          const raised = Number(bill.raised_amount ?? 0)
          const pct = fundedPercent(raised, target)
          return (
            <article key={bill.id} className='rounded-2xl border bg-white p-5 shadow-sm'>
              <p className='text-xs uppercase tracking-wide text-slate-500'>{String(bill.category ?? 'Community')}</p>
              <h2 className='mt-2 text-xl font-semibold'>{String(bill.title ?? 'Untitled bill')}</h2>
              <p className='mt-2 line-clamp-3 text-sm text-slate-600'>{String(bill.description ?? '')}</p>
              <div className='mt-4 text-sm'>
                <span className='font-medium'>Raised </span>
                <span>{formatNaira(raised)}</span>
                <span className='text-slate-500'> of {formatNaira(target)}</span>
              </div>
              <div className='mt-2 h-2 overflow-hidden rounded-full bg-slate-100'>
                <div className='h-full bg-emerald-500' style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} />
              </div>
              <Link
                to='/bills/$id'
                params={{ id: bill.id }}
                className='mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white'
              >
                View bill
              </Link>
            </article>
          )
        })}
      </div>
    </main>
  )
}
