import { useMemo, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { Trash2, Pencil, Plus, X } from 'lucide-react'
import type { DevelopmentCommitmentTwo, CreateDevelopmentCommitmentTwoDTO } from '@/types/types'
import {
  createDevelopmentCommitmentTwo,
  updateDevelopmentCommitmentTwo,
  deleteDevelopmentCommitmentTwo,
} from '@/lib/actions'
import { exportDcomm2ToPdf } from '@/lib/utils/export-pdf'
import { exportDcomm2ToMarkdown } from '@/lib/utils/export-markdown'
import DocComp from './ui/doc-comp'
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

const emptyForm = (): CreateDevelopmentCommitmentTwoDTO => ({
  eventName: '', type: '', applicationContext: '', description: '',
  impact: '', started: '', finished: '', done: false, required: false,
})

type Props = { initialEvents: DevelopmentCommitmentTwo[] }

export default function DcommTwoPage({ initialEvents }: Props) {
  const [events, setEvents] = useState<DevelopmentCommitmentTwo[]>(initialEvents)
  const [form, setForm] = useState<CreateDevelopmentCommitmentTwoDTO>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('started')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    return [...events].sort((a, b) => {
      const av = sortField === 'eventName' ? a.eventName.toLowerCase() : (a[sortField] ?? '')
      const bv = sortField === 'eventName' ? b.eventName.toLowerCase() : (b[sortField] ?? '')
      if (av === bv) return 0
      const ord = av < bv ? -1 : 1
      return sortDir === 'asc' ? ord : -ord
    })
  }, [events, sortField, sortDir])

  function setF<K extends keyof CreateDevelopmentCommitmentTwoDTO>(k: K, v: CreateDevelopmentCommitmentTwoDTO[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function openCreate() {
    setEditingId(null); setForm(emptyForm()); setError(null); setModalOpen(true)
  }

  function openEdit(ev: DevelopmentCommitmentTwo) {
    setEditingId(ev.id!)
    setForm({
      eventName: ev.eventName, type: ev.type ?? '', applicationContext: ev.applicationContext ?? '',
      description: ev.description ?? '', impact: ev.impact ?? '',
      started: ev.started ?? '', finished: ev.finished ?? '',
      done: ev.done ?? false, required: ev.required ?? false,
    })
    setError(null); setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false); setEditingId(null); setForm(emptyForm()); setError(null)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.eventName.trim()) { setError('Event name is required.'); return }
    setLoading(true); setError(null)
    try {
      if (editingId != null) {
        const updated = await updateDevelopmentCommitmentTwo(editingId, form)
        setEvents((p) => p.map((ev) => (ev.id === editingId ? updated : ev)))
      } else {
        const created = await createDevelopmentCommitmentTwo(form)
        setEvents((p) => [created, ...p])
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
      await deleteDevelopmentCommitmentTwo(id)
      setEvents((p) => p.filter((ev) => ev.id !== id))
      if (editingId === id) closeModal()
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col gap-6">
      <DocComp
        cardTitle="Innovation Commitment"
        cardDescription="Complete at least two innovation events or hackathons per year to demonstrate initiative and practical application of new skills."
        goals="Participate in at least two innovation events per year (one in Jan–Jun, one in Jul–Dec). Examples include hackathons, symposiums, bounty events, and local lab projects."
        validationCriteria={[
          'Hackathons validated by end-to-end participation and final demo.',
          'Local lab projects validated by national AD Leads via demo or recorded evidence.',
          'IIC Coach validated by patent submission with intern team.',
        ]}
        tips={[
          'Failing to complete required innovation events per half-year can affect performance ratings.',
          'Coordinate with your AD for approvals and timelines before registering.',
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
          <Button variant="outline" size="sm" onClick={() => void exportDcomm2ToPdf(events)}>Export PDF</Button>
          <Button variant="outline" size="sm" onClick={() => void exportDcomm2ToMarkdown(events)}>Export MD</Button>
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="text-sm text-muted-foreground">No events yet. Click <strong>New event</strong> to add one.</p>
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
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ev) => (
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
              ))}
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
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-card shadow-xl focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <Dialog.Title className="text-lg font-semibold">
                {editingId != null ? 'Edit event' : 'New event'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Close"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>

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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
