import { useMemo, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { Trash2, Pencil, Plus, X, Upload, Download } from 'lucide-react'
import type {
  BusinessCommitmentTwo,
  CreateBusinessCommitmentTwoDTO,
  SubEvent,
  CreateSubEventDTO,
} from '@/types/types'
import {
  createBusinessCommitmentTwo,
  updateBusinessCommitmentTwo,
  deleteBusinessCommitmentTwo,
  createSubEventForBcomm2,
  updateBcomm2SubEvent,
  deleteBcomm2SubEvent,
} from '@/lib/actions'
import { exportBcomm2ToPdf } from '@/lib/utils/export-pdf'
import { exportEachBcomm2ToMarkdown } from '@/lib/utils/export-markdown'
import DocComp from './ui/doc-comp'
import { ExportRangeButton } from './ui/export-range-button'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

type SortField = 'started' | 'finished' | 'eventName'
type SortDir = 'asc' | 'desc'
type TableTab = 'open' | 'closed'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function DoneBadge({ done }: { done?: boolean }) {
  if (!done) return null
  return (
    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
      Done
    </span>
  )
}

const emptyForm = (): CreateBusinessCommitmentTwoDTO => ({
  eventName: '', type: '', done: false, started: '', finished: '',
  required: false, applicationContext: '', description: '', impact: '',
})

const emptySubForm = (): CreateSubEventDTO => ({
  subEventName: '', description: '', started: '', finished: '', done: false,
})

type Props = { initialEvents: BusinessCommitmentTwo[] }

export default function BcommTwoPage({ initialEvents }: Props) {
  const [events, setEvents] = useState<BusinessCommitmentTwo[]>(initialEvents)
  const [subEventsByEvent, setSubEventsByEvent] = useState<Record<number, SubEvent[]>>(() => {
    const map: Record<number, SubEvent[]> = {}
    for (const ev of initialEvents) {
      if (ev.id != null) map[ev.id] = ev.subEvents ?? []
    }
    return map
  })

  const [form, setForm] = useState<CreateBusinessCommitmentTwoDTO>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'subevents'>('details')

  const [subForm, setSubForm] = useState<CreateSubEventDTO>(emptySubForm())
  const [editingSubId, setEditingSubId] = useState<number | null>(null)

  const [sortField, setSortField] = useState<SortField>('started')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [tableTab, setTableTab] = useState<TableTab>('open')

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const av = sortField === 'eventName' ? a.eventName.toLowerCase() : (a[sortField] ?? '')
      const bv = sortField === 'eventName' ? b.eventName.toLowerCase() : (b[sortField] ?? '')
      if (av === bv) return 0
      const ord = av < bv ? -1 : 1
      return sortDir === 'asc' ? ord : -ord
    })
  }, [events, sortField, sortDir])

  const openRows = useMemo(() => sorted.filter((ev) => !ev.done), [sorted])
  const closedRows = useMemo(() => sorted.filter((ev) => ev.done), [sorted])
  const visibleRows = tableTab === 'open' ? openRows : closedRows

  function setF<K extends keyof CreateBusinessCommitmentTwoDTO>(k: K, v: CreateBusinessCommitmentTwoDTO[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function openCreate() {
    setEditingId(null); setForm(emptyForm()); setSubForm(emptySubForm())
    setEditingSubId(null); setActiveTab('details'); setError(null); setModalOpen(true)
  }

  function openEdit(ev: BusinessCommitmentTwo) {
    setEditingId(ev.id!)
    setForm({
      eventName: ev.eventName, type: ev.type ?? '', done: ev.done ?? false,
      started: ev.started ?? '', finished: ev.finished ?? '', required: ev.required ?? false,
      applicationContext: ev.applicationContext ?? '', description: ev.description ?? '',
      impact: ev.impact ?? '',
    })
    setSubForm(emptySubForm()); setEditingSubId(null); setActiveTab('details'); setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false); setEditingId(null); setForm(emptyForm())
    setSubForm(emptySubForm()); setEditingSubId(null); setError(null)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.eventName.trim()) { setError('Event name is required.'); return }
    setLoading(true); setError(null)
    try {
      if (editingId != null) {
        const updated = await updateBusinessCommitmentTwo(editingId, form)
        setEvents((p) => p.map((ev) => (ev.id === editingId ? { ...updated, subEvents: ev.subEvents } : ev)))
      } else {
        const created = await createBusinessCommitmentTwo(form)
        setEvents((p) => [created, ...p])
        if (created.id != null) {
          setSubEventsByEvent((p) => ({ ...p, [created.id!]: created.subEvents ?? [] }))
        }
        closeModal()
        return
      }
      closeModal()
    } catch {
      setError('Could not save.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    setLoading(true)
    try {
      await deleteBusinessCommitmentTwo(id)
      setEvents((p) => p.filter((ev) => ev.id !== id))
      setSubEventsByEvent((p) => { const n = { ...p }; delete n[id]; return n })
      if (editingId === id) closeModal()
    } finally { setLoading(false) }
  }

  // Sub-event handlers
  async function handleSaveSub(e: FormEvent) {
    e.preventDefault()
    if (!subForm.subEventName.trim() || editingId == null) return
    setLoading(true); setError(null)
    try {
      if (editingSubId != null) {
        const updated = await updateBcomm2SubEvent(editingSubId, subForm)
        setSubEventsByEvent((p) => ({
          ...p,
          [editingId]: (p[editingId] ?? []).map((s) => (s.id === updated.id ? updated : s)),
        }))
        setEditingSubId(null)
      } else {
        const created = await createSubEventForBcomm2(editingId, subForm)
        setSubEventsByEvent((p) => ({ ...p, [editingId]: [...(p[editingId] ?? []), created] }))
      }
      setSubForm(emptySubForm())
    } catch {
      setError('Could not save sub-event.')
    } finally { setLoading(false) }
  }

  async function handleDeleteSub(subId: number) {
    if (editingId == null) return
    setLoading(true)
    try {
      await deleteBcomm2SubEvent(subId)
      setSubEventsByEvent((p) => ({ ...p, [editingId]: (p[editingId] ?? []).filter((s) => s.id !== subId) }))
    } finally { setLoading(false) }
  }

  function startEditSub(sub: SubEvent) {
    setEditingSubId(sub.id!)
    setSubForm({ subEventName: sub.subEventName, description: sub.description ?? '', started: sub.started ?? '', finished: sub.finished ?? '', done: sub.done ?? false })
  }

  const currentSubs = editingId != null ? (subEventsByEvent[editingId] ?? []) : []

  return (
    <div className="flex flex-col gap-6">
      <DocComp
        cardTitle="TDP Program Impact"
        cardDescription="Build your personal brand by participating in TDP and AT&T opportunities beyond your primary assignment."
        goals="Provide at least three examples of how you distinguished yourself and engaged within TDP; attend and participate in TDP experience events throughout the year."
        validationCriteria={[
          'Documented at least three examples showing how you strengthened your professional brand.',
          'List attended TDP experience events with dates and participation details.',
        ]}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openCreate}><Plus className="h-4 w-4" />New event</Button>
        <span className="text-sm font-medium text-muted-foreground">Sort by</span>
        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="started">Date started</SelectItem>
            <SelectItem value="finished">Date finished</SelectItem>
            <SelectItem value="eventName">Event name</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            const result = await window.api.data.readJson()
            if (!result) return
            try {
              const parsed = JSON.parse(result)
              const records = (parsed.records ?? parsed) as BusinessCommitmentTwo[]
              for (const r of records) {
                const created = await window.api.bcomm2.create(r) as BusinessCommitmentTwo
                setEvents((p) => [created, ...p])
                if (created.id != null) setSubEventsByEvent((prev) => ({ ...prev, [created.id!]: [] }))
              }
            } catch { /* bad file */ }
          }}>
            <Upload className="h-4 w-4" />Import JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const envelope = { type: 'bcomm2', version: 1, exportedAt: new Date().toISOString(), records: sorted.map(({ id: _id, createdAt: _ca, updatedAt: _ua, subEvents: _se, ...rest }) => rest) }
            const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'tdp-program-impact.json'
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
          }}>
            <Download className="h-4 w-4" />Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportBcomm2ToPdf(events)}>Export PDF</Button>
          <ExportRangeButton
            items={events}
            getDate={(ev) => ev.finished || ev.started}
            onExport={(f) => void exportEachBcomm2ToMarkdown(f)}
          />
        </div>
      </div>

      {/* Open / Closed tabs */}
      <div className="flex border-b border-border">
        {(['open', 'closed'] as const).map((tab) => {
          const count = tab === 'open' ? openRows.length : closedRows.length
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setTableTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition ${tableTab === tab ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {tab === 'open' ? 'Open' : 'Closed'}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      {visibleRows.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {tableTab === 'open'
              ? <>No open events. Click <strong>New event</strong> to add one.</>
              : 'No completed events yet. Mark events done in their edit modal.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Event Name</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Type</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Started</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Finished</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Sub-events</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((ev) => {
                const subs = subEventsByEvent[ev.id!] ?? ev.subEvents ?? []
                return (
                  <tr
                    key={ev.id}
                    onClick={() => openEdit(ev)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit(ev) } }}
                    className="cursor-pointer border-t border-border transition hover:bg-muted/40 focus:bg-muted/40 focus:outline-none"
                  >
                    <td className="max-w-xs px-4 py-3 font-medium">
                      <p className="truncate">{ev.eventName}</p>
                      {ev.applicationContext && <p className="truncate text-xs text-muted-foreground">{ev.applicationContext}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{ev.type ?? '—'}</td>
                    <td className="px-4 py-3"><DoneBadge done={ev.done} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{ev.started ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ev.finished ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{subs.length}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" aria-label="Edit" onClick={(e) => { e.stopPropagation(); openEdit(ev) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" aria-label="Delete" onClick={(e) => { e.stopPropagation(); void handleDelete(ev.id!) }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={(v) => { if (!v) closeModal() }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-card shadow-xl focus:outline-none"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <Dialog.Title className="text-lg font-semibold">
                {editingId != null ? 'Edit event' : 'New event'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Close"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>

            {/* Tabs — only show sub-events tab when editing */}
            {editingId != null && (
              <div className="flex border-b border-border">
                {(['details', 'subevents'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 text-sm font-medium transition ${activeTab === tab ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab === 'details' ? 'Details' : `Sub-events (${currentSubs.length})`}
                  </button>
                ))}
              </div>
            )}

            {/* Details tab */}
            {activeTab === 'details' && (
              <form onSubmit={(e) => void handleSave(e)} className="flex min-h-0 flex-1 flex-col">
                <div className="flex flex-col gap-3 overflow-y-auto px-6 py-4">
                  <Field label="Event name *">
                    <Input value={form.eventName} onChange={(e) => setF('eventName', e.target.value)} required />
                  </Field>
                  <Field label="Type">
                    <Input value={form.type ?? ''} onChange={(e) => setF('type', e.target.value)} />
                  </Field>
                  <Field label="Application context">
                    <Textarea rows={2} value={form.applicationContext ?? ''} onChange={(e) => setF('applicationContext', e.target.value)} />
                  </Field>
                  <Field label="Description">
                    <Textarea rows={2} value={form.description ?? ''} onChange={(e) => setF('description', e.target.value)} />
                  </Field>
                  <Field label="Impact">
                    <Textarea rows={2} value={form.impact ?? ''} onChange={(e) => setF('impact', e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Date started">
                      <Input type="date" value={form.started ?? ''} onChange={(e) => setF('started', e.target.value)} />
                    </Field>
                    <Field label="Date finished">
                      <Input type="date" value={form.finished ?? ''} onChange={(e) => setF('finished', e.target.value)} />
                    </Field>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.done ?? false} onChange={(e) => setF('done', e.target.checked)} className="h-4 w-4 rounded" />
                      Done
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.required ?? false} onChange={(e) => setF('required', e.target.checked)} className="h-4 w-4 rounded" />
                      Required
                    </label>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <div className="flex items-center gap-2 border-t border-border px-6 py-4">
                  {editingId != null && (
                    <Button type="button" variant="destructive" size="sm" disabled={loading} onClick={() => void handleDelete(editingId)}>
                      <Trash2 className="h-4 w-4" />Delete
                    </Button>
                  )}
                  <div className="ml-auto flex gap-2">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>Cancel</Button>
                    <Button type="submit" disabled={loading}>{editingId != null ? 'Save changes' : 'Add event'}</Button>
                  </div>
                </div>
              </form>
            )}

            {/* Sub-events tab */}
            {activeTab === 'subevents' && editingId != null && (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4 gap-4">
                {/* Sub-event form */}
                <form onSubmit={(e) => void handleSaveSub(e)} className="flex flex-col gap-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">{editingSubId != null ? 'Edit sub-event' : 'Add sub-event'}</p>
                  <Field label="Sub-event name *">
                    <Input value={subForm.subEventName} onChange={(e) => setSubForm((p) => ({ ...p, subEventName: e.target.value }))} required />
                  </Field>
                  <Field label="Description">
                    <Textarea rows={2} value={subForm.description ?? ''} onChange={(e) => setSubForm((p) => ({ ...p, description: e.target.value }))} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Date started">
                      <Input type="date" value={subForm.started ?? ''} onChange={(e) => setSubForm((p) => ({ ...p, started: e.target.value }))} />
                    </Field>
                    <Field label="Date finished">
                      <Input type="date" value={subForm.finished ?? ''} onChange={(e) => setSubForm((p) => ({ ...p, finished: e.target.value }))} />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={subForm.done ?? false} onChange={(e) => setSubForm((p) => ({ ...p, done: e.target.checked }))} className="h-4 w-4 rounded" />
                    Done
                  </label>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex gap-2 justify-end">
                    {editingSubId != null && (
                      <Button type="button" variant="outline" size="sm" onClick={() => { setEditingSubId(null); setSubForm(emptySubForm()) }}>Cancel</Button>
                    )}
                    <Button type="submit" size="sm" disabled={loading}>
                      {editingSubId != null ? 'Update' : <><Plus className="h-4 w-4" />Add</>}
                    </Button>
                  </div>
                </form>

                {/* Sub-events list */}
                {currentSubs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sub-events yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {currentSubs.map((sub) => (
                      <li key={sub.id} className="rounded-lg border border-border p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="font-medium">{sub.subEventName}</p>
                            {sub.description && <p className="text-muted-foreground">{sub.description}</p>}
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {sub.done && <span className="text-green-600">✓ Done</span>}
                              {sub.started && <span>Started: {sub.started}</span>}
                              {sub.finished && <span>Finished: {sub.finished}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon-xs" onClick={() => startEditSub(sub)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => void handleDeleteSub(sub.id!)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto flex justify-end border-t border-border pt-4">
                  <Button variant="outline" onClick={closeModal}>Close</Button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
