import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { formatNaira } from '@/lib/currency'

const DEFAULT_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000]

export interface AmountSheetProps {
  open: boolean
  onClose: () => void
  billTitle?: string
  amounts?: number[]
  onSelect?: (amount: number) => void
}

export function AmountSheet({
  open,
  onClose,
  billTitle,
  amounts = DEFAULT_AMOUNTS,
  onSelect,
}: AmountSheetProps) {
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    setSelected(null)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose an amount"
        className="shadow-elegant w-full max-w-md rounded-t-3xl border border-border bg-card p-6 sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Choose an amount</h2>
            {billTitle && (
              <p className="mt-1 text-sm text-muted-foreground">{billTitle}</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {amounts.map((amount) => (
            <button
              key={amount}
              type="button"
              data-testid="amount-option"
              aria-pressed={selected === amount}
              onClick={() => setSelected(amount)}
              className={`rounded-xl border p-3 text-sm font-semibold transition-all ${
                selected === amount
                  ? 'border-transparent bg-brand-gradient text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {formatNaira(amount)}
            </button>
          ))}
        </div>

        <button
          type="button"
          data-testid="amount-continue"
          disabled={selected === null}
          onClick={() => {
            if (selected !== null) onSelect?.(selected)
            onClose()
          }}
          className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-60"
        >
          {selected === null ? 'Select an amount' : `Continue with ${formatNaira(selected)}`}
        </button>
      </div>
    </div>
  )
}

export default AmountSheet
