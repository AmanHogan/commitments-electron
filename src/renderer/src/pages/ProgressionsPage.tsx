import { useEffect, useState } from 'react'
import { Plus, ArrowLeft, Trash2, Save, Eye } from 'lucide-react'
import type {
  Progression,
  SaveProgressionInput,
  StarEntry,
  DevelopmentEntry,
} from '@/types/types'
import { newManualStar, starCharCount } from '@/lib/star'
import StarEntryEditor from '@/components/star-entry-editor'
import { Textarea } from '@/components/ui/textarea'
import { DocumentViewer } from '@/components/ui/document-viewer'
import { buildProgressionDoc, type ViewerDoc } from '@/lib/document-render'

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
  const [viewerDoc, setViewerDoc] = useState<ViewerDoc | null>(null)

  useEffect(() => {
    window.api.progressions.getAll().then((rows) => setProgressions(rows as Progression[]))
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
                  onClick={() => setViewerDoc(buildProgressionDoc(p))}
                  className="flex items-center gap-1 rounded border px-3 py-1 text-sm hover:bg-accent"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
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
        <DocumentViewer doc={viewerDoc} open={viewerDoc != null} onClose={() => setViewerDoc(null)} />
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
          onClick={() => setViewerDoc(buildProgressionDoc({ id: editing!.id, title: title || 'Untitled', businessEntries, programEntries, developmentEntries }))}
          className="flex items-center gap-1 rounded border px-3 py-1.5 text-sm hover:bg-accent"
        >
          <Eye className="h-4 w-4" /> Preview
        </button>
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

      {/* Entries */}
      <div className="space-y-3">
        {tab === 'business' && (
          <>
            <button
              type="button"
              onClick={() => setBusinessEntries((prev) => [...prev, newManualStar()])}
              className="w-full rounded border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" /> Add STAR entry
            </button>
            {businessEntries.length === 0 && (
              <p className="text-xs text-muted-foreground">No entries yet. Add a STAR entry above.</p>
            )}
            {businessEntries.map((entry, i) => (
              <StarEntryEditor
                key={entry.id}
                entry={entry}
                index={i}
                onChange={(updated) => setBusinessEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
                onRemove={() => setBusinessEntries((prev) => prev.filter((e) => e.id !== entry.id))}
              />
            ))}
          </>
        )}

        {tab === 'program' && (
          <>
            <button
              type="button"
              onClick={() => setProgramEntries((prev) => [...prev, newManualStar()])}
              className="w-full rounded border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" /> Add STAR entry
            </button>
            {programEntries.length === 0 && (
              <p className="text-xs text-muted-foreground">No entries yet. Add a STAR entry above.</p>
            )}
            {programEntries.map((entry, i) => (
              <StarEntryEditor
                key={entry.id}
                entry={entry}
                index={i}
                onChange={(updated) => setProgramEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
                onRemove={() => setProgramEntries((prev) => prev.filter((e) => e.id !== entry.id))}
              />
            ))}
          </>
        )}

        {tab === 'development' && (
          <>
            <button
              type="button"
              onClick={() => setDevelopmentEntries((prev) => [...prev, { id: newDevId(), title: '', body: '', hours: undefined }])}
              className="w-full rounded border border-dashed px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
            >
              <Plus className="mr-1 inline h-3.5 w-3.5" /> Add development entry
            </button>
            {developmentEntries.length === 0 && (
              <p className="text-xs text-muted-foreground">No entries yet. Add a development entry above.</p>
            )}
            {developmentEntries.map((entry, i) => (
              <DevEntryEditor
                key={entry.id}
                entry={entry}
                index={i}
                onChange={(updated) => setDevelopmentEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
                onRemove={() => setDevelopmentEntries((prev) => prev.filter((e) => e.id !== entry.id))}
              />
            ))}
          </>
        )}
      </div>

      <DocumentViewer doc={viewerDoc} open={viewerDoc != null} onClose={() => setViewerDoc(null)} />
    </div>
  )
}
