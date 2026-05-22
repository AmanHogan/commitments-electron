
import { useMemo, useState } from "react"
import type { DevelopmentCommitmentTwo, CreateDevelopmentCommitmentTwoDTO } from "@/types/types"
import {
  createDevelopmentCommitmentTwo,
  updateDevelopmentCommitmentTwo,
  deleteDevelopmentCommitmentTwo,
} from "@/lib/actions"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "./ui/card"
import DocComp from "./ui/doc-comp"
import { exportDcomm2ToMarkdown } from "@/lib/utils/export-markdown"
import { exportDcomm2ToPdf } from "@/lib/utils/export-pdf"

type Props = {
  initialEvents: DevelopmentCommitmentTwo[]
}

const emptyEventForm = (): CreateDevelopmentCommitmentTwoDTO => ({
  eventName: "",
  type: "",
  description: "",
  started: "",
  finished: "",
  done: false,
  required: false,
})

export default function DevelopmentCommitmentTwoPage({ initialEvents }: Props) {
  const [events, setEvents] = useState<DevelopmentCommitmentTwo[]>(initialEvents)
  const [eventForm, setEventForm] = useState<CreateDevelopmentCommitmentTwoDTO>(emptyEventForm())
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<"started" | "finished" | "eventName">("started")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aVal = sortField === "eventName" ? a.eventName.toLowerCase() : (a[sortField] ?? "")
      const bVal = sortField === "eventName" ? b.eventName.toLowerCase() : (b[sortField] ?? "")
      if (aVal === bVal) return 0
      const order = aVal < bVal ? -1 : 1
      return sortDirection === "asc" ? order : -order
    })
  }, [events, sortField, sortDirection])

  function handleEventField(field: keyof CreateDevelopmentCommitmentTwoDTO, val: string | boolean | undefined) {
    setEventForm((prev) => ({ ...prev, [field]: val }))
  }

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editingEventId) {
        const updated = await updateDevelopmentCommitmentTwo(editingEventId, eventForm)
        setEvents((prev) => prev.map((ev) => (ev.id === updated.id ? { ...updated } : ev)))
        setEditingEventId(null)
      } else {
        const created = await createDevelopmentCommitmentTwo(eventForm)
        setEvents((prev) => [...prev, created])
      }
      setEventForm(emptyEventForm())
    } catch {
      setError(editingEventId ? "Failed to update event" : "Failed to create event")
    } finally {
      setLoading(false)
    }
  }

  function startEditEvent(event: DevelopmentCommitmentTwo) {
    setEditingEventId(event.id!)
    setEventForm({
      eventName: event.eventName,
      type: event.type ?? "",
      description: event.description ?? "",
      started: event.started ?? "",
      finished: event.finished ?? "",
      done: event.done ?? false,
      required: event.required ?? false,
    })
  }

  function cancelEditEvent() {
    setEditingEventId(null)
    setEventForm(emptyEventForm())
  }

  async function handleDeleteEvent(id: number) {
    try {
      await deleteDevelopmentCommitmentTwo(id)
      setEvents((prev) => prev.filter((ev) => ev.id !== id))
    } catch {
      setError("Failed to delete event")
    }
  }

  return (
    <div className="space-y-8">
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportDcomm2ToPdf(events)}
            className="rounded border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => exportDcomm2ToMarkdown(events)}
            className="rounded border px-3 py-1.5 text-sm hover:bg-accent"
          >
            Export Markdown
          </button>
        </div>
      </div>
      {/* Event form */}
      <Card className="p-0">
        <form onSubmit={handleSaveEvent} className="flex flex-col">
          <CardHeader className="pt-4">
            <CardTitle>{editingEventId ? "Edit Event" : "New Event"}</CardTitle>
            <CardDescription>
              Capture development events in the same gray card format as the other commitment pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              required
              placeholder="Event name *"
              value={eventForm.eventName}
              onChange={(e) => handleEventField("eventName", e.target.value)}
            />
            <Input
              placeholder="Type"
              value={eventForm.type ?? ""}
              onChange={(e) => handleEventField("type", e.target.value)}
            />
            <Textarea
              placeholder="Description"
              value={eventForm.description ?? ""}
              onChange={(e) => handleEventField("description", e.target.value)}
              rows={2}
            />
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-xs">Date started</Label>
                <Input
                  type="date"
                  value={eventForm.started ?? ""}
                  onChange={(e) => handleEventField("started", e.target.value)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <Label className="text-xs">Date finished</Label>
                <Input
                  type="date"
                  value={eventForm.finished ?? ""}
                  onChange={(e) => handleEventField("finished", e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={eventForm.done ?? false}
                  onChange={(e) => handleEventField("done", e.target.checked)}
                />
                Done
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={eventForm.required ?? false}
                  onChange={(e) => handleEventField("required", e.target.checked)}
                />
                Required
              </label>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {loading ? "Saving..." : editingEventId ? "Update Event" : "Add Event"}
              </button>
              {editingEventId && (
                <button type="button" onClick={cancelEditEvent} className="rounded border px-4 py-2 text-sm">
                  Cancel
                </button>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Events list */}
      <ul className="space-y-3">
        {sortedEvents.map((event) => (
          <li key={event.id}>
            <Card className="shadow-sm">
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="font-medium">{event.eventName}</p>
                    {event.type && <CardDescription>Type: {event.type}</CardDescription>}
                    {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {event.done && <span className="text-green-600">✓ Done</span>}
                      {event.required && <span>Required</span>}
                      {event.started && <span>Started: {event.started}</span>}
                      {event.finished && <span>Finished: {event.finished}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={() => startEditEvent(event)}
                      className="rounded border px-3 py-1 text-sm hover:bg-accent"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id!)}
                      className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
