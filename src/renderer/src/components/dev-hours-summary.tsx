import { useMemo, useState } from 'react'
import type { DevelopmentCommitmentOne } from '@/types/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { tagHexColor, tagColor } from './ui/tags'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select'

const TIMEFRAME_OPTIONS = [
  { value: 0, label: 'All time' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 90 days' },
  { value: 365, label: 'Last 12 months' },
]

function fmtHours(h: number): string {
  const rounded = Math.round(h * 10) / 10
  return `${rounded} hr${rounded === 1 ? '' : 's'}`
}

// Total hours for a single item: summed module hours when it has modules,
// otherwise the manually-entered hours value.
function itemHours(item: DevelopmentCommitmentOne): number {
  const count = item.moduleCount ?? item.modules?.length ?? 0
  if (count > 0) {
    return item.moduleHours ?? (item.modules?.reduce((s, m) => s + (m.hours ?? 0), 0) ?? 0)
  }
  return item.hours ?? 0
}

function itemDay(item: DevelopmentCommitmentOne): string | undefined {
  return item.itemDate || item.createdAt?.slice(0, 10)
}

export default function DevHoursSummary({ items }: { items: DevelopmentCommitmentOne[] }) {
  const [timeframeDays, setTimeframeDays] = useState(0)

  const totalHours = useMemo(() => items.reduce((s, it) => s + itemHours(it), 0), [items])

  const timeframeHours = useMemo(() => {
    if (timeframeDays === 0) return totalHours
    const now = Date.now()
    return items.reduce((s, it) => {
      const day = itemDay(it)
      if (!day || Number.isNaN(Date.parse(day))) return s
      const daysAgo = (now - new Date(day).getTime()) / 86400000
      return daysAgo >= 0 && daysAgo <= timeframeDays ? s + itemHours(it) : s
    }, 0)
  }, [items, timeframeDays, totalHours])

  // Hours attributed to each tag (an item contributes its hours to every tag it has).
  const tagSegments = useMemo(() => {
    const map = new Map<string, number>()
    let untagged = 0
    for (const it of items) {
      const h = itemHours(it)
      if (h <= 0) continue
      const tags = it.tags ?? []
      if (tags.length === 0) { untagged += h; continue }
      for (const t of tags) map.set(t, (map.get(t) ?? 0) + h)
    }
    const entries = Array.from(map.entries()).sort(([, a], [, b]) => b - a)
    if (untagged > 0) entries.push(['Untagged', untagged])
    const total = entries.reduce((s, [, h]) => s + h, 0)
    return entries.map(([tag, hours]) => ({ tag, hours, percent: total > 0 ? (hours / total) * 100 : 0 }))
  }, [items])

  const pieGradient = useMemo(() => {
    if (tagSegments.length === 0) return 'rgba(0,0,0,0)'
    let offset = 0
    const stops = tagSegments.map((s) => {
      const start = offset
      const end = offset + s.percent
      offset = end
      const color = s.tag === 'Untagged' ? '#e2e8f0' : tagHexColor(s.tag)
      return `${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`
    }).join(', ')
    return `conic-gradient(${stops})`
  }, [tagSegments])

  const itemsWithHours = useMemo(() => items.filter((it) => itemHours(it) > 0).length, [items])

  return (
    <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
      <Card>
        <CardHeader><CardTitle>Hours learned</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total hours learned</p>
              <p className="mt-2 text-3xl font-semibold">{fmtHours(totalHours)}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Timeframe</Label>
              <Select value={String(timeframeDays)} onValueChange={(v) => setTimeframeDays(Number(v))}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEFRAME_OPTIONS.map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-background p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Hours in timeframe</p>
              <p className="mt-3 text-3xl font-semibold">{fmtHours(timeframeHours)}</p>
            </div>
            <div className="rounded-lg border bg-background p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Learning items with hours</p>
              <p className="mt-3 text-3xl font-semibold">{itemsWithHours}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hours by tag</CardTitle></CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-center">
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full border"
              style={{ backgroundImage: pieGradient }}
            >
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-background">
                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold">{fmtHours(totalHours)}</p>
                </div>
              </div>
            </div>
          </div>

          {tagSegments.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No hours logged yet. Add hours (or modules) and tags to learning items to see the breakdown.</p>
          ) : (
            <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
              {tagSegments.map((seg) => (
                <div key={seg.tag} className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-block h-3.5 w-10 shrink-0 rounded-full" style={{ backgroundColor: seg.tag === 'Untagged' ? '#e2e8f0' : tagHexColor(seg.tag) }} />
                    {seg.tag === 'Untagged' ? (
                      <span className="truncate text-sm font-medium text-muted-foreground">Untagged</span>
                    ) : (
                      <span className={`truncate rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(seg.tag)}`}>{seg.tag}</span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm text-muted-foreground">{fmtHours(seg.hours)}</span>
                    <span className="text-sm font-semibold">{Math.round(seg.percent)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
