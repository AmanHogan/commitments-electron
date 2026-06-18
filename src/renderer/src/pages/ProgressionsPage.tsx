import { useEffect, useMemo, useState } from 'react'
import { Plus, ArrowLeft, Trash2, Save } from 'lucide-react'
import type {
  Progression,
  SaveProgressionInput,
  StarEntry,
  DevelopmentEntry,
  BusinessCommitmentOne,
  BusinessCommitmentTwo,
  DevelopmentCommitmentOne,
  DevelopmentCommitmentTwo,
} from '@/types/types'
import { businessToStar, bcomm2ToStar, newManualStar, starCharCount } from '@/lib/star'
import StarEntryEditor from '@/components/star-entry-editor'
import { Textarea } from '@/components/ui/textarea'

type Tab = 'business' | 'program' | 'development'

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function newDevId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function sectionChars(entries: StarEntry[]): number {
  return entries.reduce((s, e) => s + starCharCount(e), 0)
}

// ─── Development entry editor ─────────────────────────────────────────────────

interface DevEntryEditorProps {
  entry: DevelopmentEntry
  index: number
  onChange: (e: DevelopmentEntry) => void
  onRemove: () => void
}

function DevEntryEditor({ entry, index, onChange, onRemove }: DevEntryEditorProps) {
  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex-1 text-sm font-medium text-muted-foreground">#{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={entry.title}
          onChange={(e) => onChange({ ...entry, title: e.target.value })}
          placeholder="Title / commitment name"
          className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="number"
          value={entry.hours ?? ''}
          onChange={(e) => onChange({ ...entry, hours: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Hours (optional)"
          className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Textarea
          value={entry.body}
          onChange={(e) => onChange({ ...entry, body: e.target.value })}
          placeholder="Describe what you learned or accomplished…"
          rows={3}
        />
      </div>
    </div>
  )
}

// ─── Pool column ──────────────────────────────────────────────────────────────

interface PoolItemProps {
  label: string
  sub?: string
  alreadyAdded: boolean
  onAdd: () => void
}

function PoolItem({ label, sub, alreadyAdded, onAdd }: PoolItemProps) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-md border bg-card px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
      <button
        type="button"
        disabled={alreadyAdded}
        onClick={onAdd}
        className="shrink-0 rounded border px-2 py-1 text-xs hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        {alreadyAdded ? '✓' : 'Add'}
      </button>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ProgressionsPage() {
  const [progressions, setProgressions] = useState<Progression[]>([])
  const [editing, setEditing] = useState<Progression | null>(null)
  const [tab, setTab] = useState<Tab>('business')
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [businessEntries, setBusinessEntries] = useState<StarEntry[]>([])
  const [programEntries, setProgramEntries] = useState<StarEntry[]>([])
  const [developmentEntries, setDevelopmentEntries] = useState<DevelopmentEntry[]>([])

  // Pool data
  const [bcomm1Pool, setBcomm1Pool] = useState<BusinessCommitmentOne[]>([])
  const [bcomm2Pool, setBcomm2Pool] = useState<BusinessCommitmentTwo[]>([])
  const [dcomm1Pool, setDcomm1Pool] = useState<DevelopmentCommitmentOne[]>([])
  const [dcomm2Pool, setDcomm2Pool] = useState<DevelopmentCommitmentTwo[]>([])

  useEffect(() => {
    window.api.progressions.getAll().then((rows) => setProgressions(rows as Progression[]))
    window.api.bcomm1.getAll().then((rows) => setBcomm1Pool(rows as BusinessCommitmentOne[]))
    window.api.bcomm2.getAll().then((rows) => setBcomm2Pool(rows as BusinessCommitmentTwo[]))
    window.api.dcomm1.getAll().then((rows) => setDcomm1Pool(rows as DevelopmentCommitmentOne[]))
    window.api.dcomm2.getAll().then((rows) => setDcomm2Pool(rows as DevelopmentCommitmentTwo[]))
  }, [])

  function openNew() {
    setEditing({ id: -1, title: '', businessEntries: [], programEntries: [], developmentEntries: [] })
    setTitle('')
    setBusinessEntries([])
    setProgramEntries([])
    setDevelopmentEntries([])
    setTab('business')
  }

  function openEdit(p: Progression) {
    setEditing(p)
    setTitle(p.title)
    setBusinessEntries(p.businessEntries ?? [])
    setProgramEntries(p.programEntries ?? [])
    setDevelopmentEntries(p.developmentEntries ?? [])
    setTab('business')
  }

  function cancelEdit() {
    setEditing(null)
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    const input: SaveProgressionInput = { title: title.trim(), businessEntries, programEntries, developmentEntries }
    try {
      if (editing!.id === -1) {
        const created = await window.api.progressions.create(input) as Progression
        setProgressions((prev) => [created, ...prev])
      } else {
        const updated = await window.api.progressions.update(editing!.id, input) as Progression
        setProgressions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      }
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    await window.api.progressions.delete(id)
    setProgressions((prev) => prev.filter((p) => p.id !== id))
    if (editing?.id === id) setEditing(null)
  }

  // ─── Already-added sets ────────────────────────────────────────────────────
  const addedBcomm1Ids = useMemo(() => new Set(businessEntries.filter((e) => e.sourceType === 'bcomm1').map((e) => e.sourceId)), [businessEntries])
  const addedBcomm2Ids = useMemo(() => new Set(programEntries.filter((e) => e.sourceType === 'bcomm2').map((e) => e.sourceId)), [programEntries])
  const addedDcomm1Ids = useMemo(() => new Set(developmentEntries.filter((e) => e.sourceId != null).map((e) => e.sourceId)), [developmentEntries])
  const addedDcomm2Ids = useMemo(() => new Set(developmentEntries.filter((e) => e.sourceId != null).map((e) => e.sourceId)), [developmentEntries])

  const businessChars = sectionChars(businessEntries)
  const programChars = sectionChars(programEntries)

  // ─── List view ─────────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Progressions</h1>
            <p className="text-sm text-muted-foreground">Build STAR story sets for Midyear &amp; End-of-Year reviews.</p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-1 rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Progression
          </button>
        </div>
        {progressions.length === 0 && (
          <p className="text-sm text-muted-foreground">No progressions yet. Create one to get started.</p>
        )}
        <ul className="space-y-3">
          {progressions.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 shadow-sm">
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.businessEntries?.length ?? 0} business · {p.programEntries?.length ?? 0} program · {p.developmentEntries?.length ?? 0} development entries
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="rounded border px-3 py-1 text-sm hover:bg-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  className="rounded border px-3 py-1 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // ─── Editor view ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={cancelEdit} className="flex items-center gap-1 rounded border px-3 py-1.5 text-sm hover:bg-accent">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Progression title…"
          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
        />
        {editing.id !== -1 && (
          <button
            type="button"
            onClick={() => handleDelete(editing.id)}
            className="flex items-center gap-1 rounded border px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-1 rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b text-sm">
        {([
          { key: 'business' as Tab, label: `Business Impact (${businessEntries.length})`, chars: businessChars },
          { key: 'program' as Tab, label: `Program Impact (${programEntries.length})`, chars: programChars },
          { key: 'development' as Tab, label: `Development (${developmentEntries.length})`, chars: undefined as number | undefined },
        ]).map(({ key, label, chars }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 -mb-px border-b-2 transition-colors ${tab === key ? 'border-primary text-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {label}
            {chars !== undefined && chars > 0 && (
              <span className={`text-xs ${chars > 4000 ? 'text-red-500' : 'text-muted-foreground'}`}>{chars}</span>
            )}
          </button>
        ))}
      </div>

      {/* Two-column layout: pool (left) + selected (right) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left — import pool */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Import from existing data</p>

          {tab === 'business' && (
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {bcomm1Pool.length === 0 && <p className="text-xs text-muted-foreground">No Business Partner Impact entries.</p>}
              {bcomm1Pool.map((c) => (
                <PoolItem
                  key={c.id}
                  label={c.workItem}
                  sub={c.description ?? undefined}
                  alreadyAdded={addedBcomm1Ids.has(c.id)}
                  onAdd={() => setBusinessEntries((prev) => [...prev, businessToStar(c)])}
                />
              ))}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setBusinessEntries((prev) => [...prev, newManualStar()])}
                  className="w-full rounded border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
                >
                  + Add manual STAR entry
                </button>
              </div>
            </div>
          )}

          {tab === 'program' && (
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {bcomm2Pool.length === 0 && <p className="text-xs text-muted-foreground">No TDP Program Impact events.</p>}
              {bcomm2Pool.map((e) => (
                <PoolItem
                  key={e.id}
                  label={e.eventName}
                  sub={e.type ?? undefined}
                  alreadyAdded={addedBcomm2Ids.has(e.id)}
                  onAdd={() => setProgramEntries((prev) => [...prev, bcomm2ToStar(e)])}
                />
              ))}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setProgramEntries((prev) => [...prev, newManualStar()])}
                  className="w-full rounded border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
                >
                  + Add manual STAR entry
                </button>
              </div>
            </div>
          )}

          {tab === 'development' && (
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground mb-1">Development Commitments</p>
              {dcomm1Pool.map((d) => (
                <PoolItem
                  key={`d1-${d.id}`}
                  label={d.itemName}
                  alreadyAdded={addedDcomm1Ids.has(d.id)}
                  onAdd={() => setDevelopmentEntries((prev) => [...prev, {
                    id: newDevId(),
                    sourceId: d.id,
                    title: d.itemName,
                    body: '',
                    hours: undefined,
                  }])}
                />
              ))}
              <p className="text-xs text-muted-foreground mt-2 mb-1">Innovation Commitments</p>
              {dcomm2Pool.map((e) => (
                <PoolItem
                  key={`d2-${e.id}`}
                  label={e.eventName}
                  sub={e.type ?? undefined}
                  alreadyAdded={addedDcomm2Ids.has(e.id)}
                  onAdd={() => setDevelopmentEntries((prev) => [...prev, {
                    id: newDevId(),
                    sourceId: e.id,
                    title: e.eventName,
                    body: e.description ?? '',
                    hours: undefined,
                  }])}
                />
              ))}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setDevelopmentEntries((prev) => [...prev, { id: newDevId(), title: '', body: '', hours: undefined }])}
                  className="w-full rounded border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
                >
                  + Add blank entry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right — selected/editing entries */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tab === 'business' ? 'Business STAR entries' : tab === 'program' ? 'Program STAR entries' : 'Development paragraphs'}
          </p>

          {tab === 'business' && (
            <>
              {businessEntries.length === 0 && (
                <p className="text-xs text-muted-foreground">Import from the left or add a manual entry.</p>
              )}
              <div className="space-y-3">
                {businessEntries.map((entry, i) => (
                  <StarEntryEditor
                    key={entry.id}
                    entry={entry}
                    index={i}
                    onChange={(updated) => setBusinessEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
                    onRemove={() => setBusinessEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                  />
                ))}
              </div>
            </>
          )}

          {tab === 'program' && (
            <>
              {programEntries.length === 0 && (
                <p className="text-xs text-muted-foreground">Import from the left or add a manual entry.</p>
              )}
              <div className="space-y-3">
                {programEntries.map((entry, i) => (
                  <StarEntryEditor
                    key={entry.id}
                    entry={entry}
                    index={i}
                    onChange={(updated) => setProgramEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
                    onRemove={() => setProgramEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                  />
                ))}
              </div>
            </>
          )}

          {tab === 'development' && (
            <>
              {developmentEntries.length === 0 && (
                <p className="text-xs text-muted-foreground">Import from the left or add a blank entry.</p>
              )}
              <div className="space-y-3">
                {developmentEntries.map((entry, i) => (
                  <DevEntryEditor
                    key={entry.id}
                    entry={entry}
                    index={i}
                    onChange={(updated) => setDevelopmentEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
                    onRemove={() => setDevelopmentEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
