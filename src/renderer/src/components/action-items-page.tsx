
import { useMemo, useState, type FormEvent } from "react"
import { Dialog } from "radix-ui"
import { Trash2, Pencil, Plus, X, Check } from "lucide-react"
import type { ActionItem, CreateActionItemDTO } from "@/types/types"
import { CRITICALITY_OPTIONS, emptyActionItemForm } from "@/types/types"
import { createActionItem, updateActionItem, deleteActionItem } from "@/lib/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportActionItemsToMarkdown } from "@/lib/utils/export-markdown"

const criticalityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
}

type TableTab = "open" | "closed"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

type Props = {
  initialItems: ActionItem[]
}

export default function ActionItemsPage({ initialItems }: Props) {
  const [items, setItems] = useState<ActionItem[]>(initialItems)
  const [form, setForm] = useState<CreateActionItemDTO>(emptyActionItemForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [tableTab, setTableTab] = useState<TableTab>("open")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  function openCreate() {
    setEditingId(null)
    setForm(emptyActionItemForm())
    setError(null)
    setModalOpen(true)
  }

  function openEdit(item: ActionItem) {
    setEditingId(item.id!)
    setForm({
      name: item.name,
      description: item.description ?? "",
      criticality: item.criticality ?? "",
      dateStarted: item.dateStarted ?? "",
      dateFinished: item.dateFinished ?? "",
      dueDate: item.dueDate ?? "",
      dueTime: item.dueTime ?? "",
      completed: item.completed ?? false,
    })
    setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setForm(emptyActionItemForm())
    setError(null)
  }

  function handleField(field: keyof CreateActionItemDTO, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError("Name is required"); return }
    setLoading(true); setError(null)
    try {
      if (editingId !== null) {
        const updated = await updateActionItem(editingId, form)
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      } else {
        const created = await createActionItem(form)
        setItems((prev) => [...prev, created])
      }
      closeModal()
    } catch {
      setError(editingId !== null ? "Failed to save changes" : "Failed to create action item")
    } finally {
      setLoading(false)
    }
  }

  async function markDone(item: ActionItem) {
    try {
      const updated = await updateActionItem(item.id!, {
        ...item,
        completed: true,
        dateFinished: today,
      })
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    } catch {
      setError("Failed to mark item as done")
    }
  }

  async function handleDelete(id: number) {
    setLoading(true)
    try {
      await deleteActionItem(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      if (editingId === id) closeModal()
    } catch {
      setError("Failed to delete action item")
    } finally {
      setLoading(false)
    }
  }

  const openItems = useMemo(() => items.filter((i) => !i.completed), [items])
  const closedItems = useMemo(() => items.filter((i) => i.completed), [items])
  const visibleItems = tableTab === "open" ? openItems : closedItems

  function renderTable(rows: ActionItem[]) {
    if (rows.length === 0) {
      return (
        <div className="rounded-lg border border-dashed py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {tableTab === "open" ? "No open action items. Click Create action item to add one." : "No completed items yet."}
          </p>
        </div>
      )
    }
    return (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Name</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Criticality</th>
              {tableTab === "open" ? (
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Due Date</th>
              ) : (
                <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Finished</th>
              )}
              <th className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Started</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const isOverdue = !item.completed && item.dueDate && item.dueDate < today
              const isDueToday = !item.completed && item.dueDate && item.dueDate === today
              return (
                <tr
                  key={item.id}
                  onClick={() => openEdit(item)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEdit(item) } }}
                  className="cursor-pointer border-t border-border transition hover:bg-muted/40 focus:bg-muted/40 focus:outline-none"
                >
                  <td className="max-w-xs px-4 py-3 font-medium">
                    <p className="truncate">{item.name}</p>
                    {item.description && <p className="truncate text-xs text-muted-foreground">{item.description}</p>}
                    {isOverdue && (
                      <span className="mt-0.5 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                        Overdue
                      </span>
                    )}
                    {isDueToday && (
                      <span className="mt-0.5 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                        Due Today
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.criticality ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${criticalityColors[item.criticality] ?? "bg-gray-100 text-gray-700"}`}>
                        {item.criticality}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {tableTab === "open"
                      ? (item.dueDate ? `${item.dueDate}${item.dueTime ? ` ${item.dueTime}` : ""}` : "—")
                      : (item.dateFinished ?? "—")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.dateStarted ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {tableTab === "open" && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Mark done"
                          title="Mark as done"
                          onClick={() => void markDone(item)}
                          className="text-green-600 hover:bg-green-50 hover:text-green-700"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon-xs" aria-label="Edit" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" aria-label="Delete" onClick={() => void handleDelete(item.id!)} disabled={loading}>
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
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openCreate}><Plus className="h-4 w-4" />Create action item</Button>
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={() => exportActionItemsToMarkdown([...openItems, ...closedItems])}>
            Export MD
          </Button>
        </div>
      </div>

      {/* Open / Closed tabs */}
      <div className="flex border-b border-border">
        {(["open", "closed"] as const).map((tab) => {
          const count = tab === "open" ? openItems.length : closedItems.length
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setTableTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition ${tableTab === tab ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab === "open" ? "Open" : "Closed"}
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{count}</span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Table */}
      {renderTable(visibleItems)}

      {/* Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={(v) => { if (!v) closeModal() }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-card shadow-xl focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <Dialog.Title className="text-lg font-semibold">
                {editingId !== null ? "Edit action item" : "Create action item"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Close"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-col gap-3 overflow-y-auto px-6 py-4">
                <Field label="Name *">
                  <Input
                    value={form.name}
                    onChange={(e) => handleField("name", e.target.value)}
                    placeholder="Action item name"
                    required
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    rows={2}
                    value={form.description ?? ""}
                    onChange={(e) => handleField("description", e.target.value)}
                    placeholder="Describe the action item"
                  />
                </Field>

                <Field label="Criticality">
                  <Select value={form.criticality ?? ""} onValueChange={(val) => handleField("criticality", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select criticality" />
                    </SelectTrigger>
                    <SelectContent>
                      {CRITICALITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Due Date">
                    <Input type="date" value={form.dueDate ?? ""} onChange={(e) => handleField("dueDate", e.target.value)} />
                  </Field>
                  <Field label="Due Time">
                    <Input type="time" value={form.dueTime ?? ""} onChange={(e) => handleField("dueTime", e.target.value)} />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date Started">
                    <Input type="date" value={form.dateStarted ?? ""} onChange={(e) => handleField("dateStarted", e.target.value)} />
                  </Field>
                  <Field label="Date Finished">
                    <Input type="date" value={form.dateFinished ?? ""} onChange={(e) => handleField("dateFinished", e.target.value)} />
                  </Field>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="completed"
                    type="checkbox"
                    checked={form.completed ?? false}
                    onChange={(e) => handleField("completed", e.target.checked)}
                    className="h-4 w-4 rounded border"
                  />
                  <Label htmlFor="completed">Completed</Label>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>

              <div className="flex items-center gap-2 border-t border-border px-6 py-4">
                {editingId !== null && (
                  <Button type="button" variant="destructive" size="sm" disabled={loading} onClick={() => void handleDelete(editingId)}>
                    <Trash2 className="h-4 w-4" />Delete
                  </Button>
                )}
                <div className="ml-auto flex gap-2">
                  <Button type="button" variant="outline" onClick={closeModal} disabled={loading}>Cancel</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : editingId !== null ? "Save changes" : "Create"}
                  </Button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
