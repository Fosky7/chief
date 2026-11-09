import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { approveBill, fetchAdminQueue, isCurrentUserAdmin, markBillPaid, rejectBill } from '@/services/admin'
import type { AdminQueueBill } from '@/services/admin'
import { formatNaira } from '@/lib/currency'

export const Route = createFileRoute('/admin')({
  head: () => ({ meta: [{ title: 'Admin review - KrossBuild' }] }),
  component: AdminPage,
})

function AdminPage() {
  const [bills, setBills] = useState<AdminQueueBill[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const admin = await isCurrentUserAdmin()
      setIsAdmin(Boolean(admin))
      if (!admin) {
        setBills([])
        setLoading(false)
        return
      }

      const raw: unknown = await fetchAdminQueue()
      const list = Array.isArray(raw) ? raw : (raw as { bills?: AdminQueueBill[]; queue?: AdminQueueBill[] })?.bills ?? (raw as { queue?: AdminQueueBill[] })?.queue ?? []
      setBills(list as AdminQueueBill[])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the review queue.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusyId(id)
    setMessage('')
    setError('')
    try {
      await action()
      setMessage(success)
      await load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Action failed.')
    }
    setBusyId('')
  }

  if (loading) {
    return <main className='mx-auto max-w-5xl px-4 py-10 text-sm text-slate-600'>Loading review queue...</main>
  }

  if (!isAdmin) {
    return (
      <main className='mx-auto max-w-5xl px-4 py-10'>
        <h1 className='text-3xl font-semibold'>Admins only</h1>
        <p className='mt-3 text-sm text-slate-600'>This area is restricted to administrators.</p>
        <Link to='/' className='mt-4 inline-block text-sm underline'>Return home</Link>
      </main>
    )
  }

  return (
    <main className='mx-auto max-w-5xl px-4 py-10'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold'>Bills awaiting review</h1>
          <p className='mt-2 text-sm text-slate-600'>Approve genuine bills, reject duplicates, and mark funded bills as paid.</p>
        </div>
        <Link to='/' className='text-sm underline'>Home</Link>
      </div>

      {message ? <p className='mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700'>{message}</p> : null}
      {error ? <p className='mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</p> : null}

      {bills.length === 0 ? (
        <div className='mt-8 rounded-2xl border bg-white p-8 text-center shadow-sm'>
          <h2 className='text-xl font-semibold'>No bills awaiting review</h2>
          <p className='mt-2 text-sm text-slate-600'>New submissions will appear here.</p>
        </div>
      ) : null}

      <div className='mt-8 grid gap-4'>
        {bills.map((bill) => {
          const status = String(bill.status ?? 'pending')
          const raised = Number((bill as unknown as { raised_amount?: number }).raised_amount ?? 0)
          const id = String(bill.id)
          return (
            <article key={id} className='rounded-2xl border bg-white p-5 shadow-sm'>
              <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
                <div>
                  <p className='text-xs uppercase tracking-wide text-slate-500'>{status === 'pending' ? 'Pending review' : status}</p>
                  <h2 className='mt-1 text-xl font-semibold'>{String(bill.title ?? 'Untitled bill')}</h2>
                  <p className='mt-1 text-sm text-slate-600'>{String(bill.description ?? '')}</p>
                </div>
                <div className='text-sm font-medium'>Raised {formatNaira(raised)}</div>
              </div>

              <div className='mt-4 flex flex-wrap gap-2'>
                {status === 'pending' ? (
                  <>
                    <button
                      type='button'
                      disabled={busyId === id}
                      onClick={() => run(id, () => approveBill(id), 'Bill approved')}
                      className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60'
                    >
                      Approve
                    </button>
                    <button
                      type='button'
                      disabled={busyId === id}
                      onClick={() => run(id, () => rejectBill(id), 'Bill rejected')}
                      className='rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60'
                    >
                      Reject
                    </button>
                  </>
                ) : null}
                {status !== 'pending' && status !== 'paid' ? (
                  <button
                    type='button'
                    disabled={busyId === id}
                    onClick={() => run(id, () => markBillPaid(id), 'Paid out')}
                    className='rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60'
                  >
                    Mark paid to biller
                  </button>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
