
import { useMemo, useState } from "react"
import type { ActionItem, CreateActionItemDTO } from "@/types/types"
import { CRITICALITY_OPTIONS, emptyActionItemForm } from "@/types/types"
import { createActionItem, updateActionItem, deleteActionItem } from "@/lib/actions"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { exportActionItemsToMarkdown } from "@/lib/utils/export-markdown"

const criticalityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
}

type SortField = "none" | "dateStarted" | "criticality" | "completed"
type SortDirection = "asc" | "desc"

type Props = {
  initialItems: ActionItem[]
}

export default function ActionItemsPage({ initialItems }: Props) {
  const [items, setItems] = useState<ActionItem[]>(initialItems)
  const [form, setForm] = useState<CreateActionItemDTO>(emptyActionItemForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sortField, setSortField] = useState<SortField>("none")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleField(field: keyof CreateActionItemDTO, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("Name is required")
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (editingId !== null) {
        const updated = await updateActionItem(editingId, form)
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        setEditingId(null)
      } else {
        const created = await createActionItem(form)
        setItems((prev) => [...prev, created])
      }
      setForm(emptyActionItemForm())
    } catch {
      setError(editingId !== null ? "Failed to save changes" : "Failed to create action item")
    } finally {
      setLoading(false)
    }
  }

  function startEdit(item: ActionItem) {
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
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyActionItemForm())
    setError(null)
  }

  async function markDone(item: ActionItem) {
    const today = new Date().toISOString().slice(0, 10)
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
    } catch {
      setError("Failed to delete action item")
    } finally {
      setLoading(false)
    }
  }

  const sortedItems = useMemo(() => {
    const sorted = [...items]
    const rank: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4,
    }

    const compare = (a: ActionItem, b: ActionItem) => {
      if (sortField === "dateStarted") {
        if (!a.dateStarted) return 1
        if (!b.dateStarted) return -1
        return a.dateStarted.localeCompare(b.dateStarted)
      }

      if (sortField === "criticality") {
        return (rank[a.criticality ?? "MEDIUM"] ?? 99) - (rank[b.criticality ?? "MEDIUM"] ?? 99)
      }

      if (sortField === "completed") {
        return Number(a.completed ?? false) - Number(b.completed ?? false)
      }

      return 0
    }

    if (sortField !== "none") {
      sorted.sort((a, b) => {
        const result = compare(a, b)
        return sortDirection === "asc" ? result : -result
      })
    }

    return sorted
  }, [items, sortField, sortDirection])

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => exportActionItemsToMarkdown(sortedItems)}>
          Export to Markdown
        </Button>
      </div>
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId !== null ? "Edit Action Item" : "Add Action Item"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                placeholder="Action item name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description ?? ""}
                onChange={(e) => handleField("description", e.target.value)}
                placeholder="Describe the action item"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="criticality">Criticality</Label>
              <Select value={form.criticality ?? ""} onValueChange={(val) => handleField("criticality", val)}>
                <SelectTrigger id="criticality">
                  <SelectValue placeholder="Select criticality" />
                </SelectTrigger>
                <SelectContent>
                  {CRITICALITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateStarted">Date Started</Label>
                <Input
                  id="dateStarted"
                  type="date"
                  value={form.dateStarted ?? ""}
                  onChange={(e) => handleField("dateStarted", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateFinished">Date Finished</Label>
                <Input
                  id="dateFinished"
                  type="date"
                  value={form.dateFinished ?? ""}
                  onChange={(e) => handleField("dateFinished", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate ?? ""}
                  onChange={(e) => handleField("dueDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueTime">Due Time</Label>
                <Input
                  id="dueTime"
                  type="time"
                  value={form.dueTime ?? ""}
                  onChange={(e) => handleField("dueTime", e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId !== null ? "Save Changes" : "Add Item"}
              </Button>
              {editingId !== null && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <div className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Sort by</Label>
            <Select value={sortField} onValueChange={(val) => setSortField(val as SortField)}>
              <SelectTrigger id="sortField">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="dateStarted">Date Started</SelectItem>
                <SelectItem value="criticality">Criticality</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Direction</Label>
            <Select value={sortDirection} onValueChange={(val) => setSortDirection(val as SortDirection)}>
              <SelectTrigger id="sortDirection">
                <SelectValue placeholder="Descending" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-slate-500">Showing {sortedItems.length} items</div>
      </div>
      <div className="space-y-3">
        {sortedItems.length === 0 && <p className="text-sm text-muted-foreground">No action items yet.</p>}
        {sortedItems.map((item) => {
          const today = new Date().toISOString().slice(0, 10)
          const isOverdue = !item.completed && item.dueDate && item.dueDate < today
          const isDueToday = !item.completed && item.dueDate && item.dueDate === today
          return (
            <Card key={item.id} className={isOverdue ? "border-red-400" : isDueToday ? "border-yellow-400" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{item.name}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {item.criticality && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            criticalityColors[item.criticality] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.criticality}
                        </span>
                      )}
                      {item.completed ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          Completed
                        </span>
                      ) : null}
                      {isOverdue && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Overdue
                        </span>
                      )}
                      {isDueToday && (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                          Due Today
                        </span>
                      )}
                      {item.description && <span>Description: {item.description}</span>}
                      {item.dateStarted && <span>Started: {item.dateStarted}</span>}
                      {item.dateFinished && <span>Finished: {item.dateFinished}</span>}
                    </div>
                    {item.dueDate && (
                      <p className={`text-xs font-medium ${isOverdue ? "text-red-600" : isDueToday ? "text-yellow-600" : "text-muted-foreground"}`}>
                        Due: {item.dueDate}{item.dueTime ? ` at ${item.dueTime}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    {!item.completed && (
                      <Button size="sm" variant="outline" className="border-green-400 text-green-700 hover:bg-green-50" onClick={() => markDone(item)}>
                        ✓ Done
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id!)} disabled={loading}>
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
