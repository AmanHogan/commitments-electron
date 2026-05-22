import { useEffect, useState } from 'react'

type BriefingItem = {
  id: number
  name: string
  dueDate: string
  dueTime?: string
  criticality?: string
  completed?: boolean
}

const CRITICALITY_COLOR: Record<string, string> = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
}

const CRITICALITY_TEXT: Record<string, string> = {
  LOW: 'text-green-700 bg-green-100',
  MEDIUM: 'text-yellow-700 bg-yellow-100',
  HIGH: 'text-orange-700 bg-orange-100',
  CRITICAL: 'text-red-700 bg-red-100',
}

function playChime() {
  try {
    const ctx = new AudioContext()
    const notes = [
      { freq: 523.25, start: 0 },
      { freq: 659.25, start: 0.18 },
      { freq: 783.99, start: 0.36 },
    ]
    for (const { freq, start } of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.45)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + 0.5)
    }
    setTimeout(() => ctx.close(), 1200)
  } catch { /* skip */ }
}

export default function StartupBriefing() {
  const [items, setItems] = useState<BriefingItem[] | null>(null)

  useEffect(() => {
    // Pull-based: we ask main for the data once we're mounted.
    // This guarantees the listener (setItems) exists before data arrives —
    // avoids the race condition where Windows starts slower than Mac.
    window.api.notifications.rendererReady()
      .then((raw) => {
        const list = raw as BriefingItem[]
        if (list.length === 0) return
        setItems(list)
        playChime()
      })
      .catch(() => {})
  }, [])

  if (!items) return null

  const today = new Date().toISOString().slice(0, 10)

  const overdue = items.filter((i) => i.dueDate < today)
  const dueToday = items.filter((i) => i.dueDate === today)
  const upcoming = items.filter((i) => i.dueDate > today)

  function formatDate(item: BriefingItem) {
    if (item.dueDate === today) return item.dueTime ? `Today at ${item.dueTime}` : 'Today'
    return item.dueTime ? `${item.dueDate} at ${item.dueTime}` : item.dueDate
  }

  function Section({ title, badge, color, rows }: {
    title: string
    badge: string
    color: string
    rows: BriefingItem[]
  }) {
    if (rows.length === 0) return null
    return (
      <div className="mb-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${color}`}>{badge}</span>
        </div>
        <ul className="space-y-1.5">
          {rows.map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${CRITICALITY_COLOR[item.criticality ?? ''] ?? 'bg-blue-400'}`} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(item)}</p>
              </div>
              {item.criticality && (
                <span className={`ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${CRITICALITY_TEXT[item.criticality] ?? 'bg-gray-100 text-gray-700'}`}>
                  {item.criticality}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[360px] animate-in slide-in-from-bottom-4 fade-in duration-300"
      role="dialog"
      aria-label="Startup briefing"
    >
      <div className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Upcoming Action Items</p>
              <p className="text-[11px] text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''} with due dates</p>
            </div>
          </div>
          <button
            onClick={() => setItems(null)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Item list — scrollable if tall */}
        <div className="max-h-[400px] overflow-y-auto px-4 py-3">
          <Section
            title="Overdue"
            badge={String(overdue.length)}
            color="text-red-700 bg-red-100"
            rows={overdue}
          />
          <Section
            title="Due Today"
            badge={String(dueToday.length)}
            color="text-yellow-700 bg-yellow-100"
            rows={dueToday}
          />
          <Section
            title="Upcoming"
            badge={String(upcoming.length)}
            color="text-blue-700 bg-blue-100"
            rows={upcoming}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5">
          <button
            onClick={() => setItems(null)}
            className="w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
