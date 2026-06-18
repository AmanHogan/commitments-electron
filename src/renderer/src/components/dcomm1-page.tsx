import { useMemo, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { Trash2, Pencil, Plus, X, Upload, Download } from 'lucide-react'
import type {
  DevelopmentCommitmentOne,
  CreateDevelopmentCommitmentOneDTO,
  LearningModule,
  CreateLearningModuleDTO,
} from '@/types/types'
import {
  createDevelopmentCommitmentOne,
  updateDevelopmentCommitmentOne,
  deleteDevelopmentCommitmentOne,
  getModulesForItem,
  createModuleForItem,
  updateLearningModule,
  deleteLearningModule,
} from '@/lib/actions'
import { exportDcomm1ToPdf } from '@/lib/utils/export-pdf'
import { exportEachDcomm1ToMarkdown } from '@/lib/utils/export-markdown'
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

type SortField = 'itemDate' | 'createdAt' | 'itemName'
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

const emptyItemForm = (): CreateDevelopmentCommitmentOneDTO => ({ itemName: '', description: '', itemDate: '', done: false })

function DoneBadge({ done }: { done?: boolean }) {
  if (!done) return null
  return (
    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
      Done
    </span>
  )
}

const emptyModuleForm = (): CreateLearningModuleDTO => ({
  moduleName: '', type: '', hours: undefined,
  dateStarted: '', dateFinished: '', finished: false, required: false, description: '',
})

async function importJsonItems(onImport: (items: DevelopmentCommitmentOne[]) => void) {
  const result = await window.api.data.readJson()
  if (!result) return
  try {
    const parsed = JSON.parse(result)
    const records = (parsed.records ?? parsed) as DevelopmentCommitmentOne[]
    onImport(records)
  } catch { /* bad file */ }
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

type Props = { initialItems: DevelopmentCommitmentOne[] }

export default function DcommOnePage({ initialItems }: Props) {
  const [items, setItems] = useState<DevelopmentCommitmentOne[]>(initialItems)
  const [modulesByItem, setModulesByItem] = useState<Record<number, LearningModule[]>>({})
  const [loadedIds, setLoadedIds] = useState<Set<number>>(new Set())

  const [itemForm, setItemForm] = useState<CreateDevelopmentCommitmentOneDTO>(emptyItemForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'modules'>('details')

  const [modForm, setModForm] = useState<CreateLearningModuleDTO>(emptyModuleForm())
  const [editingModId, setEditingModId] = useState<number | null>(null)

  const [sortField, setSortField] = useState<SortField>('itemDate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [tableTab, setTableTab] = useState<TableTab>('open')

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const av = sortField === 'itemName' ? a.itemName.toLowerCase()
        : sortField === 'itemDate' ? (a.itemDate ?? a.createdAt ?? '')
        : (a.createdAt ?? '')
      const bv = sortField === 'itemName' ? b.itemName.toLowerCase()
        : sortField === 'itemDate' ? (b.itemDate ?? b.createdAt ?? '')
        : (b.createdAt ?? '')
      if (av === bv) return 0
      const ord = av < bv ? -1 : 1
      return sortDir === 'asc' ? ord : -ord
    })
  }, [items, sortField, sortDir])

  const openRows = useMemo(() => sorted.filter((it) => !it.done), [sorted])
  const closedRows = useMemo(() => sorted.filter((it) => it.done), [sorted])
  const visibleRows = tableTab === 'open' ? openRows : closedRows

  async function loadModules(id: number) {
    if (loadedIds.has(id)) return
    try {
      const mods = await getModulesForItem(id)
      setModulesByItem((p) => ({ ...p, [id]: mods }))
      setLoadedIds((p) => new Set([...p, id]))
    } catch { /* silent */ }
  }

  function openCreate() {
    setEditingId(null); setItemForm(emptyItemForm()); setModForm(emptyModuleForm())
    setEditingModId(null); setActiveTab('details'); setError(null); setModalOpen(true)
  }

  async function openEdit(item: DevelopmentCommitmentOne) {
    setEditingId(item.id!)
    setItemForm({ itemName: item.itemName, description: item.description ?? '', itemDate: item.itemDate ?? '', done: item.done ?? false })
    setModForm(emptyModuleForm()); setEditingModId(null); setActiveTab('details'); setError(null)
    setModalOpen(true)
    await loadModules(item.id!)
  }

  function closeModal() {
    setModalOpen(false); setEditingId(null); setItemForm(emptyItemForm())
    setModForm(emptyModuleForm()); setEditingModId(null); setError(null)
  }

  async function handleSaveItem(e: FormEvent) {
    e.preventDefault()
    if (!itemForm.itemName.trim()) { setError('Item name is required.'); return }
    setLoading(true); setError(null)
    try {
      if (editingId != null) {
        const updated = await updateDevelopmentCommitmentOne(editingId, itemForm)
        setItems((p) => p.map((it) => (it.id === editingId ? updated : it)))
        closeModal()
      } else {
        const created = await createDevelopmentCommitmentOne(itemForm)
        setItems((p) => [created, ...p])
        closeModal()
      }
    } catch {
      setError('Could not save.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteItem(id: number) {
    setLoading(true)
    try {
      await deleteDevelopmentCommitmentOne(id)
      setItems((p) => p.filter((it) => it.id !== id))
      if (editingId === id) closeModal()
    } finally { setLoading(false) }
  }

  // Module handlers
  async function handleSaveMod(e: FormEvent) {
    e.preventDefault()
    if (!modForm.moduleName.trim() || editingId == null) return
    setLoading(true); setError(null)
    try {
      if (editingModId != null) {
        const updated = await updateLearningModule(editingModId, modForm)
        setModulesByItem((p) => ({ ...p, [editingId]: (p[editingId] ?? []).map((m) => (m.id === updated.id ? updated : m)) }))
        setEditingModId(null)
      } else {
        const created = await createModuleForItem(editingId, modForm)
        setModulesByItem((p) => ({ ...p, [editingId]: [...(p[editingId] ?? []), created] }))
      }
      setModForm(emptyModuleForm())
    } catch {
      setError('Could not save module.')
    } finally { setLoading(false) }
  }

  async function handleDeleteMod(modId: number) {
    if (editingId == null) return
    setLoading(true)
    try {
      await deleteLearningModule(modId)
      setModulesByItem((p) => ({ ...p, [editingId]: (p[editingId] ?? []).filter((m) => m.id !== modId) }))
    } finally { setLoading(false) }
  }

  function startEditMod(mod: LearningModule) {
    setEditingModId(mod.id!)
    setModForm({
      moduleName: mod.moduleName, type: mod.type ?? '', hours: mod.hours,
      dateStarted: mod.dateStarted ?? '', dateFinished: mod.dateFinished ?? '',
      finished: mod.finished ?? false, required: mod.required ?? false, description: mod.description ?? '',
    })
  }

  const currentMods = editingId != null ? (modulesByItem[editingId] ?? []) : []

  return (
    <div className="flex flex-col gap-6">
      <DocComp
        cardTitle="Development Commitment"
        cardDescription="Build track-aligned technical skills, AI capabilities, business knowledge, and leadership skills."
        goals="Complete Purpose-Driven training across technical, AI, leadership, and business areas; complete assigned GrowthHub and mandatory corporate training."
        validationCriteria={[
          'Track development progress in monthly 1-on-1s with your AD.',
          'Document completed courses for reviews and progression submissions.',
        ]}
        tips={[
          'Use GrowthHub to find and log courses aligned to your track.',
          'Coordinate with your AD to prioritize mandatory vs. elective training.',
        ]}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openCreate}><Plus className="h-4 w-4" />New item</Button>
        <span className="text-sm font-medium text-muted-foreground">Sort by</span>
        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="itemDate">Item date</SelectItem>
            <SelectItem value="createdAt">Date added</SelectItem>
            <SelectItem value="itemName">Item name</SelectItem>
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
          <Button variant="outline" size="sm" onClick={() => void importJsonItems(async (records) => {
            for (const r of records) {
              const created = await window.api.dcomm1.create(r) as DevelopmentCommitmentOne
              setItems((p) => [created, ...p])
            }
          })}>
            <Upload className="h-4 w-4" />Import JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            const envelope = { type: 'dcomm1', version: 1, exportedAt: new Date().toISOString(), records: items.map(({ id: _id, createdAt: _ca, updatedAt: _ua, modules: _m, ...rest }) => rest) }
            downloadBlob(JSON.stringify(envelope, null, 2), 'development-commitment.json', 'application/json')
          }}>
            <Download className="h-4 w-4" />Export JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportDcomm1ToPdf(items, modulesByItem)}>Export PDF</Button>
          <ExportRangeButton
            items={items}
            getDate={(it) => it.itemDate || it.createdAt}
            onExport={(f) => void exportEachDcomm1ToMarkdown(f)}
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
              ? <>No open learning items. Click <strong>New item</strong> to add one.</>
              : 'No completed items yet. Mark items done in their edit modal.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Item Name</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Modules</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((item) => {
                const mods = modulesByItem[item.id!] ?? item.modules ?? []
                return (
                  <tr
                    key={item.id}
                    onClick={() => void openEdit(item)}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); void openEdit(item) } }}
                    className="cursor-pointer border-t border-border transition hover:bg-muted/40 focus:bg-muted/40 focus:outline-none"
                  >
                    <td className="max-w-xs px-4 py-3 font-medium">
                      <p className="truncate">{item.itemName}</p>
                      {item.description && <p className="truncate text-xs text-muted-foreground">{item.description}</p>}
                    </td>
                    <td className="px-4 py-3"><DoneBadge done={item.done} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.itemDate ?? (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{mods.length}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" aria-label="Edit" onClick={(e) => { e.stopPropagation(); void openEdit(item) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" aria-label="Delete" onClick={(e) => { e.stopPropagation(); void handleDeleteItem(item.id!) }}>
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
                {editingId != null ? 'Edit learning item' : 'New learning item'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Close"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>

            {/* Tabs — only when editing */}
            {editingId != null && (
              <div className="flex border-b border-border">
                {(['details', 'modules'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 text-sm font-medium transition ${activeTab === tab ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab === 'details' ? 'Details' : `Modules (${currentMods.length})`}
                  </button>
                ))}
              </div>
            )}

            {/* Details tab */}
            {activeTab === 'details' && (
              <form onSubmit={(e) => void handleSaveItem(e)} className="flex min-h-0 flex-1 flex-col">
                <div className="flex flex-col gap-3 overflow-y-auto px-6 py-4">
                  <Field label="Item name *">
                    <Input value={itemForm.itemName} onChange={(e) => setItemForm((p) => ({ ...p, itemName: e.target.value }))} required />
                  </Field>
                  <Field label="Description">
                    <Textarea rows={3} value={itemForm.description ?? ''} onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))} placeholder="What does this learning item cover? Goals, context, relevance to your track..." />
                  </Field>
                  <Field label="Item date">
                    <Input type="date" value={itemForm.itemDate ?? ''} onChange={(e) => setItemForm((p) => ({ ...p, itemDate: e.target.value }))} />
                  </Field>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={itemForm.done ?? false} onChange={(e) => setItemForm((p) => ({ ...p, done: e.target.checked }))} className="h-4 w-4 rounded" />
                    Done
                  </label>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <div className="flex items-center gap-2 border-t border-border px-6 py-4">
                  {editingId != null && (
                    <Button type="button" variant="destructive" size="sm" disabled={loading} onClick={() => void handleDeleteItem(editingId)}>
                      <Trash2 className="h-4 w-4" />Delete
                    </Button>
                  )}
                  <div className="ml-auto flex gap-2">
                    <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>Cancel</Button>
                    <Button type="submit" disabled={loading}>{editingId != null ? 'Save changes' : 'Add item'}</Button>
                  </div>
                </div>
              </form>
            )}

            {/* Modules tab */}
            {activeTab === 'modules' && editingId != null && (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4 gap-4">
                {/* Module form */}
                <form onSubmit={(e) => void handleSaveMod(e)} className="flex flex-col gap-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">{editingModId != null ? 'Edit module' : 'Add module'}</p>
                  <Field label="Module name *">
                    <Input value={modForm.moduleName} onChange={(e) => setModForm((p) => ({ ...p, moduleName: e.target.value }))} required />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Type">
                      <Input value={modForm.type ?? ''} onChange={(e) => setModForm((p) => ({ ...p, type: e.target.value }))} placeholder="e.g. course, book" />
                    </Field>
                    <Field label="Hours">
                      <Input type="number" value={modForm.hours ?? ''} onChange={(e) => setModForm((p) => ({ ...p, hours: e.target.value ? parseFloat(e.target.value) : undefined }))} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Date started">
                      <Input type="date" value={modForm.dateStarted ?? ''} onChange={(e) => setModForm((p) => ({ ...p, dateStarted: e.target.value }))} />
                    </Field>
                    <Field label="Date finished">
                      <Input type="date" value={modForm.dateFinished ?? ''} onChange={(e) => setModForm((p) => ({ ...p, dateFinished: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="Description">
                    <Textarea rows={2} value={modForm.description ?? ''} onChange={(e) => setModForm((p) => ({ ...p, description: e.target.value }))} />
                  </Field>
                  <div className="flex gap-4 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={modForm.finished ?? false} onChange={(e) => setModForm((p) => ({ ...p, finished: e.target.checked }))} className="h-4 w-4 rounded" />
                      Finished
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={modForm.required ?? false} onChange={(e) => setModForm((p) => ({ ...p, required: e.target.checked }))} className="h-4 w-4 rounded" />
                      Required
                    </label>
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex gap-2 justify-end">
                    {editingModId != null && (
                      <Button type="button" variant="outline" size="sm" onClick={() => { setEditingModId(null); setModForm(emptyModuleForm()) }}>Cancel</Button>
                    )}
                    <Button type="submit" size="sm" disabled={loading}>
                      {editingModId != null ? 'Update' : <><Plus className="h-4 w-4" />Add</>}
                    </Button>
                  </div>
                </form>

                {/* Modules list */}
                {currentMods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No modules yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {currentMods.map((mod) => (
                      <li key={mod.id} className="rounded-lg border border-border p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className="font-medium">{mod.moduleName}</p>
                            {mod.type && <p className="text-muted-foreground">Type: {mod.type}</p>}
                            {mod.hours != null && <p className="text-muted-foreground">Hours: {mod.hours}</p>}
                            {mod.dateStarted && <p className="text-muted-foreground">Started: {mod.dateStarted}</p>}
                            {mod.dateFinished && <p className="text-muted-foreground">Finished: {mod.dateFinished}</p>}
                            {mod.description && <p className="text-muted-foreground">{mod.description}</p>}
                            <div className="flex gap-3 text-xs text-muted-foreground">
                              {mod.finished && <span className="text-green-600">✓ Finished</span>}
                              {mod.required && <span>Required</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon-xs" onClick={() => startEditMod(mod)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => void handleDeleteMod(mod.id!)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
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
