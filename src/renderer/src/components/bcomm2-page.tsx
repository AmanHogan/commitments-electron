
import { useMemo, useState } from "react"
import type { BusinessCommitmentTwo, CreateBusinessCommitmentTwoDTO, SubEvent, CreateSubEventDTO } from "@/types/types"
import {
  createBusinessCommitmentTwo,
  updateBusinessCommitmentTwo,
  deleteBusinessCommitmentTwo,
  createSubEventForBcomm2,
  updateBcomm2SubEvent,
  deleteBcomm2SubEvent,
} from "@/lib/actions"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "./ui/card"
import DocComp from "./ui/doc-comp"
import { exportBcomm2ToMarkdown } from "@/lib/utils/export-markdown"

type Props = {
  initialEvents: BusinessCommitmentTwo[]
}

const emptyForm = (): CreateBusinessCommitmentTwoDTO => ({
  eventName: "",
  type: "",
  done: false,
  started: "",
  finished: "",
  required: false,
  description: "",
})

const emptySubEventForm = (): CreateSubEventDTO => ({
  subEventName: "",
  description: "",
  started: "",
  finished: "",
  done: false,
})

export default function BusinessCommitmentTwoPage({ initialEvents }: Props) {
  const [events, setEvents] = useState<BusinessCommitmentTwo[]>(initialEvents)
  const [form, setForm] = useState<CreateBusinessCommitmentTwoDTO>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null)
  const [sortField, setSortField] = useState<"started" | "finished" | "eventName">("started")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const [subEventsByEvent, setSubEventsByEvent] = useState<Record<number, SubEvent[]>>(() => {
    const map: Record<number, SubEvent[]> = {}
    for (const ev of initialEvents) {
      if (ev.id != null) map[ev.id] = ev.subEvents ?? []
    }
    return map
  })
  const [subEventForm, setSubEventForm] = useState<CreateSubEventDTO>(emptySubEventForm())
  const [editingSubEventId, setEditingSubEventId] = useState<number | null>(null)

  function handleField(field: keyof CreateBusinessCommitmentTwoDTO, val: string | boolean | undefined) {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aValue = sortField === "eventName" ? a.eventName.toLowerCase() : (a[sortField] ?? "")
      const bValue = sortField === "eventName" ? b.eventName.toLowerCase() : (b[sortField] ?? "")

      if (aValue === bValue) return 0
      const order = aValue < bValue ? -1 : 1
      return sortDirection === "asc" ? order : -order
    })
  }, [events, sortField, sortDirection])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editingId) {
        const updated = await updateBusinessCommitmentTwo(editingId, form)
        setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? { ...updated, subEvents: ev.subEvents } : ev)))
        setEditingId(null)
      } else {
        const created = await createBusinessCommitmentTwo(form)
        setEvents((prev) => [...prev, created])
        if (created.id != null) {
          setSubEventsByEvent((prev) => ({ ...prev, [created.id!]: created.subEvents ?? [] }))
        }
      }
      setForm(emptyForm())
    } catch {
      setError(editingId ? "Failed to update event" : "Failed to create event")
    } finally {
      setLoading(false)
    }
  }

  function startEdit(event: BusinessCommitmentTwo) {
    setEditingId(event.id!)
    setForm({
      eventName: event.eventName,
      type: event.type ?? "",
      done: event.done ?? false,
      started: event.started ?? "",
      finished: event.finished ?? "",
      required: event.required ?? false,
      description: event.description ?? "",
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm())
  }

  async function handleDelete(id: number) {
    try {
      await deleteBusinessCommitmentTwo(id)
      setEvents((prev) => prev.filter((ev) => ev.id !== id))
      setSubEventsByEvent((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      if (expandedEventId === id) setExpandedEventId(null)
    } catch {
      setError("Failed to delete event")
    }
  }

  async function toggleExpand(event: BusinessCommitmentTwo) {
    const id = event.id!
    if (expandedEventId === id) {
      setExpandedEventId(null)
    } else {
      setExpandedEventId(id)
      setSubEventForm(emptySubEventForm())
      setEditingSubEventId(null)
    }
  }

  function handleSubEventField(field: keyof CreateSubEventDTO, val: string | boolean | undefined) {
    setSubEventForm((prev) => ({ ...prev, [field]: val }))
  }

  async function handleSaveSubEvent(e: React.FormEvent, eventId: number) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editingSubEventId) {
        const updated = await updateBcomm2SubEvent(editingSubEventId, subEventForm)
        setSubEventsByEvent((prev) => ({
          ...prev,
          [eventId]: prev[eventId].map((s) => (s.id === updated.id ? updated : s)),
        }))
        setEditingSubEventId(null)
      } else {
        const created = await createSubEventForBcomm2(eventId, subEventForm)
        setSubEventsByEvent((prev) => ({
          ...prev,
          [eventId]: [...(prev[eventId] ?? []), created],
        }))
      }
      setSubEventForm(emptySubEventForm())
    } catch {
      setError(editingSubEventId ? "Failed to update sub-event" : "Failed to create sub-event")
    } finally {
      setLoading(false)
    }
  }

  function startEditSubEvent(sub: SubEvent) {
    setEditingSubEventId(sub.id!)
    setSubEventForm({
      subEventName: sub.subEventName,
      description: sub.description ?? "",
      started: sub.started ?? "",
      finished: sub.finished ?? "",
      done: sub.done ?? false,
    })
  }

  function cancelEditSubEvent() {
    setEditingSubEventId(null)
    setSubEventForm(emptySubEventForm())
  }

  async function handleDeleteSubEvent(subId: number, eventId: number) {
    try {
      await deleteBcomm2SubEvent(subId)
      setSubEventsByEvent((prev) => ({
        ...prev,
        [eventId]: prev[eventId].filter((s) => s.id !== subId),
      }))
    } catch {
      setError("Failed to delete sub-event")
    }
  }

  return (
    <div className="space-y-8">
      <DocComp
        cardTitle="TDP Program Impact"
        cardDescription="Build your personal brand by participating in TDP and AT&T opportunities beyond your primary assignment."
        goals="Provide at least three examples of how you distinguished yourself and engaged within TDP; attend and participate in TDP experience events throughout the year."
        validationCriteria={[
          'Documented at least three examples showing how you strengthened your professional brand.',
          'List attended TDP experience events with dates and participation details.',
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Sort by:</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as "started" | "finished" | "eventName")}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="started">Date started</option>
            <option value="finished">Date finished</option>
            <option value="eventName">Event name</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
            className="rounded border px-3 py-1.5 text-sm hover:bg-accent"
          >
            {sortDirection === "asc" ? "Ascending" : "Descending"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => exportBcomm2ToMarkdown(events)}
          className="rounded border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Export to Markdown
        </button>
      </div>
      <Card className="p-0">
        <form onSubmit={handleSave} className="flex flex-col">
          <CardHeader className="pt-4">
            <CardTitle>{editingId ? "Edit Event" : "New Leadership Event"}</CardTitle>
            <CardDescription>
              Track your leadership events and create sub-events from a unified card layout.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              required
              placeholder="Event name *"
              value={form.eventName}
              onChange={(e) => handleField("eventName", e.target.value)}
            />
            <Input placeholder="Type" value={form.type ?? ""} onChange={(e) => handleField("type", e.target.value)} />
            <Textarea
              placeholder="Description"
              value={form.description ?? ""}
              onChange={(e) => handleField("description", e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-xs">Date started</Label>
                <Input
                  type="date"
                  value={form.started ?? ""}
                  onChange={(e) => handleField("started", e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-xs">Date finished</Label>
                <Input
                  type="date"
                  value={form.finished ?? ""}
                  onChange={(e) => handleField("finished", e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.done ?? false}
                  onChange={(e) => handleField("done", e.target.checked)}
                />
                Done
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.required ?? false}
                  onChange={(e) => handleField("required", e.target.checked)}
                />
                Required
              </label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {loading ? "Saving..." : editingId ? "Update Event" : "Add Event"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="rounded border px-4 py-2 text-sm">
                  Cancel
                </button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>

      <ul className="space-y-3">
        {sortedEvents.map((event) => {
          const isExpanded = expandedEventId === event.id
          const subs = subEventsByEvent[event.id!] ?? []
          return (
            <li key={event.id}>
              <Card className="shadow-sm">
                <div className="flex items-start justify-between p-4">
                  <div className="space-y-0.5">
                    <CardTitle className="text-base">{event.eventName}</CardTitle>
                    {event.type && <CardDescription>Type: {event.type}</CardDescription>}
                    {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {event.done && <span className="text-green-600">✓ Done</span>}
                      {event.required && <span>Required</span>}
                      {event.started && <span>Started: {event.started}</span>}
                      {event.finished && <span>Finished: {event.finished}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{subs.length} sub-event(s)</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={() => toggleExpand(event)}
                      className="rounded border px-3 py-1 text-sm hover:bg-accent"
                    >
                      {isExpanded ? "Collapse" : "Sub-events"}
                    </button>
                    <button
                      onClick={() => startEdit(event)}
                      className="rounded border px-3 py-1 text-sm hover:bg-accent"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id!)}
                      className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="space-y-4 border-t px-4 pt-3 pb-4">
                    <form onSubmit={(e) => handleSaveSubEvent(e, event.id!)} className="flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {editingSubEventId ? "Edit Sub-event" : "Add Sub-event"}
                        </p>
                      </div>
                      <Input
                        required
                        placeholder="Sub-event name *"
                        value={subEventForm.subEventName}
                        onChange={(e) => handleSubEventField("subEventName", e.target.value)}
                      />
                      <Textarea
                        placeholder="Description"
                        value={subEventForm.description ?? ""}
                        onChange={(e) => handleSubEventField("description", e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Date started</Label>
                          <Input
                            type="date"
                            value={subEventForm.started ?? ""}
                            onChange={(e) => handleSubEventField("started", e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Date finished</Label>
                          <Input
                            type="date"
                            value={subEventForm.finished ?? ""}
                            onChange={(e) => handleSubEventField("finished", e.target.value)}
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={subEventForm.done ?? false}
                          onChange={(e) => handleSubEventField("done", e.target.checked)}
                        />
                        Done
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {loading ? "Saving..." : editingSubEventId ? "Update" : "Add Sub-event"}
                        </button>
                        {editingSubEventId && (
                          <button
                            type="button"
                            onClick={cancelEditSubEvent}
                            className="rounded border px-3 py-1 text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>

                    {subs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No sub-events yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {subs.map((sub) => (
                          <li key={sub.id} className="rounded border p-3 text-sm">
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
                              <div className="flex shrink-0 gap-1">
                                <button
                                  onClick={() => startEditSubEvent(sub)}
                                  className="rounded border px-2 py-1 text-xs hover:bg-accent"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteSubEvent(sub.id!, event.id!)}
                                  className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                )}
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
