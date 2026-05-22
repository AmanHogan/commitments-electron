import { useEffect, useState } from 'react'

type ReminderData = {
  id: number
  name: string
  dueDate?: string
  dueTime?: string
  criticality?: string
  intervalKey: string
  minutesBefore: number | null
}

type QueuedReminder = ReminderData & { queuedAt: number }

const CRITICALITY_COLOR: Record<string, string> = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
}

function intervalLabel(r: ReminderData): string {
  if (r.intervalKey === 'due-today') return 'Due today'
  if (r.intervalKey === 'due') return 'Due now'
  if (r.intervalKey === 'overdue') return 'Past due'
  if (r.minutesBefore === 1) return 'Due in 1 minute'
  if (r.minutesBefore != null) return `Due in ${r.minutesBefore} minutes`
  return 'Reminder'
}

function timeLabel(r: ReminderData): string {
  if (!r.dueDate) return ''
  const parts: string[] = [r.dueDate]
  if (r.dueTime) parts.push(`at ${r.dueTime}`)
  return parts.join(' ')
}

const SNOOZE_OPTIONS = [
  { label: '5 min', minutes: 5 },
  { label: '15 min', minutes: 15 },
  { label: '1 hour', minutes: 60 },
]

/**
 * Plays a soft 3-note ascending chime using Web Audio API.
 * No external file needed — works on both Mac and Windows.
 */
function playChime() {
  try {
    const ctx = new AudioContext()
    // C5 → E5 → G5  (major chord arpeggio, gentle and distinct)
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
      // Fade in quickly, then fade out over ~400 ms
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.45)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + 0.5)
    }
    // Close context after all notes finish
    setTimeout(() => ctx.close(), 1200)
  } catch {
    // AudioContext not available — silently skip
  }
}

export default function ReminderToast() {
  const [queue, setQueue] = useState<QueuedReminder[]>([])

  useEffect(() => {
    const off = window.api.notifications.onReminder((raw) => {
      const data = raw as ReminderData
      setQueue((prev) => {
        // Don't add if same item+interval is already in the queue
        if (prev.some((r) => r.id === data.id && r.intervalKey === data.intervalKey)) return prev
        playChime()
        return [...prev, { ...data, queuedAt: Date.now() }]
      })
    })
    return off
  }, [])

  // No auto-dismiss — toast stays until the user explicitly snoozes or dismisses

  const current = queue[0] ?? null

  function handleSnooze(id: number, minutes: number) {
    window.api.notifications.snooze(id, minutes).catch(() => {})
    setQueue((prev) => prev.filter((r) => r !== current))
  }

  function handleDismiss(id: number) {
    window.api.notifications.dismiss(id).catch(() => {})
    setQueue((prev) => prev.filter((r) => r !== current))
  }

  if (!current) return null

  const extraCount = queue.length - 1

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[340px] animate-in slide-in-from-bottom-4 fade-in duration-300"
      role="alertdialog"
      aria-label="Action item reminder"
    >
      <div className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
        {/* Coloured top stripe based on criticality */}
        <div className={`h-1 w-full ${CRITICALITY_COLOR[current.criticality ?? ''] ?? 'bg-blue-500'}`} />

        <div className="p-4">
          {/* Bell icon + label row */}
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span className="mt-px text-base">🔔</span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {intervalLabel(current)}
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
                  {current.name}
                </p>
                {timeLabel(current) && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{timeLabel(current)}</p>
                )}
              </div>
            </div>
            {current.criticality && (
              <span
                className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                  CRITICALITY_COLOR[current.criticality] ?? 'bg-gray-400'
                }`}
              >
                {current.criticality}
              </span>
            )}
          </div>

          {/* Snooze + Dismiss buttons */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[11px] text-muted-foreground">Snooze:</span>
            {SNOOZE_OPTIONS.map((opt) => (
              <button
                key={opt.minutes}
                onClick={() => handleSnooze(current.id, opt.minutes)}
                className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-accent transition-colors"
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => handleDismiss(current.id)}
              className="ml-auto rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Queue overflow badge */}
        {extraCount > 0 && (
          <div className="border-t border-border bg-muted/50 px-4 py-2">
            <p className="text-[11px] text-muted-foreground">
              +{extraCount} more reminder{extraCount > 1 ? 's' : ''} — will show after this one
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
