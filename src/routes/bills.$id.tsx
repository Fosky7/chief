import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { supabase } from '@/integrations/supabase/client'
import { formatNaira, fundedPercent } from '@/lib/currency'

export const Route = createFileRoute('/bills/$id')({
  head: () => ({ meta: [{ title: 'Bill detail - KrossBuild' }] }),
  component: BillDetailPage,
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
  [key: string]: unknown
}

function targetOf(bill: Bill | null): number {
  if (!bill) return 0
  return Number(bill.target_amount ?? bill.amount ?? 0)
}

function BillDetailPage() {
  const { id } = Route.useParams()
  const [bill, setBill] = useState<Bill | null>(null)
  const [donations, setDonations] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState('1000')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: authData } = await supabase.auth.getUser()
    setSignedIn(Boolean(authData.user))

    const { data, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (billError) setError(billError.message)
    setBill((data as Bill | null) ?? null)

    const { data: donationRows, error: donationError } = await supabase
      .from('donations')
      .select('*')
      .eq('bill_id', id)

    if (donationError) setError(donationError.message)
    setDonations((donationRows as Array<Record<string, unknown>>) ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const donatedTotal = donations.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const raised = donatedTotal > 0 ? donatedTotal : Number(bill?.raised_amount ?? 0)
  const target = targetOf(bill)
  const pct = fundedPercent(raised, target)

  async function donate() {
    setMessage('')
    setError('')
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid donation amount.')
      return
    }

    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      setError('Please sign in to donate.')
      return
    }

    setSaving(true)
    let insertError = (
      await supabase.from('donations').insert({
        bill_id: id,
        user_id: authData.user.id,
        amount: value,
      })
    ).error

    if (insertError && /user_id|donor_id|column/i.test(insertError.message)) {
      insertError = (
        await supabase.from('donations').insert({
          bill_id: id,
          donor_id: authData.user.id,
          amount: value,
        })
      ).error
    }

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    setMessage('Donation recorded. Thank you for supporting this bill.')
    setAmount('1000')
    await load()
  }

  if (loading) {
    return <main className='mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground'>Loading bill...</main>
  }

  if (!bill) {
    return (
      <main className='mx-auto max-w-3xl px-4 py-10'>
        <h1 className='text-2xl font-semibold'>Bill not found</h1>
        {error ? <p className='mt-2 text-sm text-red-600'>{error}</p> : null}
        <Link to='/discover' className='mt-4 inline-block text-sm underline'>Back to discover</Link>
      </main>
    )
  }

  return (
    <main className='mx-auto max-w-3xl px-4 py-10'>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <Link to='/discover' className='text-sm underline'>Back to discover</Link>
        <span className='rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-wide text-slate-700'>
          {String(bill.status ?? 'pending')}
        </span>
      </div>

      <article className='rounded-2xl border bg-white p-6 shadow-sm'>
        <p className='text-xs uppercase tracking-wide text-slate-500'>{String(bill.category ?? 'Community')}</p>
        <h1 className='mt-2 text-3xl font-semibold'>{String(bill.title ?? 'Untitled bill')}</h1>
        <p className='mt-3 text-slate-700'>{String(bill.description ?? 'No description provided.')}</p>

        <div className='mt-6 grid gap-3 sm:grid-cols-3'>
          <div className='rounded-xl bg-slate-50 p-4'>
            <p className='text-xs uppercase text-slate-500'>Total raised</p>
            <p className='mt-1 text-xl font-semibold'>{formatNaira(raised)}</p>
          </div>
          <div className='rounded-xl bg-slate-50 p-4'>
            <p className='text-xs uppercase text-slate-500'>Target</p>
            <p className='mt-1 text-xl font-semibold'>{formatNaira(target)}</p>
          </div>
          <div className='rounded-xl bg-slate-50 p-4'>
            <p className='text-xs uppercase text-slate-500'>Funded</p>
            <p className='mt-1 text-xl font-semibold'>{Math.round(pct)}%</p>
          </div>
        </div>

        <div className='mt-4 h-3 overflow-hidden rounded-full bg-slate-100'>
          <div className='h-full bg-emerald-500' style={{ width: Math.min(100, Math.max(0, pct)) + '%' }} />
        </div>
      </article>

      <section className='mt-6 rounded-2xl border bg-white p-6 shadow-sm'>
        <h2 className='text-xl font-semibold'>Donate to this bill</h2>
        {signedIn ? (
          <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
            <label className='flex-1 text-sm font-medium'>
              Amount
              <input
                type='number'
                min='1'
                step='1'
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className='mt-1 w-full rounded-lg border px-3 py-2'
              />
            </label>
            <button
              type='button'
              onClick={donate}
              disabled={saving}
              className='mt-5 rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white disabled:opacity-60'
            >
              {saving ? 'Recording...' : 'Donate'}
            </button>
          </div>
        ) : (
          <p className='mt-3 text-sm text-slate-700'>
            <Link to='/auth' className='underline'>Sign in</Link> to donate to this bill.
          </p>
        )}
        {message ? <p className='mt-3 text-sm text-emerald-700'>{message}</p> : null}
        {error ? <p className='mt-3 text-sm text-red-600'>{error}</p> : null}
      </section>

      <section className='mt-6 rounded-2xl border bg-white p-6 shadow-sm'>
        <h2 className='text-xl font-semibold'>Recent donations</h2>
        {donations.length === 0 ? (
          <p className='mt-3 text-sm text-slate-600'>No donations yet. Be the first to contribute.</p>
        ) : (
          <ul className='mt-3 divide-y'>
            {donations.slice(0, 8).map((row, index) => (
              <li key={String(row.id ?? index)} className='flex items-center justify-between py-2 text-sm'>
                <span className='text-slate-600'>Supporter</span>
                <span className='font-medium'>{formatNaira(Number(row.amount ?? 0))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
