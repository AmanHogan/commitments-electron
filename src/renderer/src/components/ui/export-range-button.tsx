import { useMemo, useState } from 'react'
import { Dialog } from 'radix-ui'
import { X, Download } from 'lucide-react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'

type RangePreset =
  | 'all'
  | 'thisMonth'
  | 'last3'
  | 'last6'
  | 'last12'
  | 'thisYear'
  | 'lastYear'
  | 'custom'

const PRESET_LABELS: { value: RangePreset; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'last3', label: 'Last 3 months' },
  { value: 'last6', label: 'Last 6 months' },
  { value: 'last12', label: 'Last 12 months' },
  { value: 'thisYear', label: 'This year' },
  { value: 'lastYear', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
]

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function computeBounds(preset: RangePreset, customStart: string, customEnd: string): { start?: string; end?: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (preset) {
    case 'all':
      return {}
    case 'thisMonth':
      return { start: fmt(new Date(y, m, 1)), end: fmt(new Date(y, m + 1, 0)) }
    case 'last3':
      return { start: fmt(new Date(y, m - 3, now.getDate())), end: fmt(now) }
    case 'last6':
      return { start: fmt(new Date(y, m - 6, now.getDate())), end: fmt(now) }
    case 'last12':
      return { start: fmt(new Date(y - 1, m, now.getDate())), end: fmt(now) }
    case 'thisYear':
      return { start: `${y}-01-01`, end: `${y}-12-31` }
    case 'lastYear':
      return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` }
    case 'custom':
      return { start: customStart || undefined, end: customEnd || undefined }
  }
}

type Props<T> = {
  items: T[]
  /** Returns the date (YYYY-MM-DD or ISO) used to decide whether an item is in range. */
  getDate: (item: T) => string | undefined | null
  onExport: (filtered: T[]) => void | Promise<void>
  label?: string
}

export function ExportRangeButton<T>({ items, getDate, onExport, label = 'Export MD' }: Props<T>) {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<RangePreset>('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    if (preset === 'all') return items
    const bounds = computeBounds(preset, customStart, customEnd)
    return items.filter((it) => {
      const raw = getDate(it)
      if (!raw) return false
      const day = raw.slice(0, 10)
      if (bounds.start && day < bounds.start) return false
      if (bounds.end && day > bounds.end) return false
      return true
    })
  }, [items, preset, customStart, customEnd, getDate])

  async function handleExport() {
    setBusy(true)
    try {
      await onExport(filtered)
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Download className="h-4 w-4" />{label}
      </Button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-card shadow-xl focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <Dialog.Title className="text-lg font-semibold">Export to Markdown</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Close"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>

            <div className="flex flex-col gap-4 px-6 py-5">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold">Date range</Label>
                <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRESET_LABELS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {preset === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">From</Label>
                    <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">To</Label>
                    <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {filtered.length} of {items.length} item{items.length === 1 ? '' : 's'} will be exported
                {preset !== 'all' && ' (items without a date are excluded from ranged exports).'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
              <Button type="button" onClick={() => void handleExport()} disabled={busy || filtered.length === 0}>
                <Download className="h-4 w-4" />Export {filtered.length > 0 ? `(${filtered.length})` : ''}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
