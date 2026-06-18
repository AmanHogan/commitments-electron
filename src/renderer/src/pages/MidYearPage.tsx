import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { Plus, Pencil, Trash2, X, CalendarCheck, Eye } from 'lucide-react'
import type { MidYearCheckin } from '@/types/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DocumentViewer } from '@/components/ui/document-viewer'
import { buildMidYearDoc, type ViewerDoc } from '@/lib/document-render'

// ─── Workday question structure ───────────────────────────────────────────────

const QUESTIONS = [
  {
    key: 'businessAccomplishments' as const,
    section: 'BUSINESS COMMITMENTS',
    prompt: 'What do I view as my top 3–5 accomplishments year to date?',
    placeholder: 'Describe your top accomplishments related to your Business Partner assignment and TDP program impact. Be specific — include what you did, who benefited, and the measurable outcome.',
  },
  {
    key: 'developmentProgress' as const,
    prompt: 'What key progress have I made on development commitments year to date?',
    section: 'DEVELOPMENT COMMITMENTS',
    placeholder: 'Describe progress on technical training, GrowthHub completions, leadership/soft skills, AI learning, certifications, and any grad-phase milestones.',
  },
  {
    key: 'goingForwardPriorities' as const,
    section: 'ALIGNING GOING FORWARD',
    prompt: 'What do I view as my key priorities or focus areas going forward?',
    placeholder: 'List your main priorities for the remainder of the year — what you still need to accomplish and how you plan to get there.',
  },
]

type FormState = {
  title: string
  businessAccomplishments: string
  developmentProgress: string
  goingForwardPriorities: string
}

function emptyForm(): FormState {
  return { title: '', businessAccomplishments: '', developmentProgress: '', goingForwardPriorities: '' }
}

function formFrom(c: MidYearCheckin): FormState {
  return {
    title: c.title,
    businessAccomplishments: c.businessAccomplishments,
    developmentProgress: c.developmentProgress,
    goingForwardPriorities: c.goingForwardPriorities,
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  )
}

export default function MidYearPage() {
  const [checkins, setCheckins] = useState<MidYearCheckin[]>([])
  const [form, setForm] = useState<FormState>(emptyForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewerDoc, setViewerDoc] = useState<ViewerDoc | null>(null)

  useEffect(() => {
    void window.api.midyear.getAll().then((all) => setCheckins(all as MidYearCheckin[]))
  }, [])

  function openCreate() {
    setEditingId(null); setForm(emptyForm()); setError(null); setModalOpen(true)
  }

  function openEdit(c: MidYearCheckin) {
    setEditingId(c.id); setForm(formFrom(c)); setError(null); setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false); setEditingId(null); setForm(emptyForm()); setError(null)
  }

  function setF<K extends keyof FormState>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setLoading(true); setError(null)
    try {
      if (editingId != null) {
        const updated = await window.api.midyear.update(editingId, form) as MidYearCheckin
        setCheckins((p) => p.map((c) => (c.id === editingId ? updated : c)))
      } else {
        const created = await window.api.midyear.create(form) as MidYearCheckin
        setCheckins((p) => [created, ...p])
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
      await window.api.midyear.delete(id)
      setCheckins((p) => p.filter((c) => c.id !== id))
      if (editingId === id) closeModal()
    } finally { setLoading(false) }
  }

  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleDateString() } catch { return iso }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Mid-Year Check-in</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer the Workday mid-year questions for each review period. A response for each section is mandatory.
          Mid-year reviews cover Business and Development commitments only — Innovation is tracked at end-of-year.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button onClick={openCreate}><Plus className="h-4 w-4" />New check-in</Button>
      </div>

      {/* List */}
      {checkins.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <CalendarCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No check-ins yet. Click <strong>New check-in</strong> to add your first mid-year response.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {checkins.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold">{c.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Created {formatDate(c.createdAt)} · Updated {formatDate(c.updatedAt)}</p>
                  {/* Preview snippets */}
                  <div className="mt-2 flex flex-col gap-1">
                    {QUESTIONS.map((q) => {
                      const val = c[q.key]
                      return val ? (
                        <p key={q.key} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{q.section}: </span>
                          {val.slice(0, 120)}{val.length > 120 ? '…' : ''}
                        </p>
                      ) : (
                        <p key={q.key} className="text-xs text-muted-foreground/50 italic">{q.section}: no response yet</p>
                      )
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-xs" aria-label="View" onClick={() => setViewerDoc(buildMidYearDoc(c))}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => void handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentViewer doc={viewerDoc} open={viewerDoc != null} onClose={() => setViewerDoc(null)} />

      {/* Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={(v) => { if (!v) closeModal() }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-card shadow-xl focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <Dialog.Title className="text-lg font-semibold">
                {editingId != null ? 'Edit check-in' : 'New mid-year check-in'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Close"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
                {/* Title */}
                <Field label="Title">
                  <Input
                    value={form.title}
                    onChange={(e) => setF('title', e.target.value)}
                    placeholder="e.g. Mid-Year Check-in 2026"
                    required
                  />
                </Field>

                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Answer the questions below — a response for each is mandatory.</p>

                {/* 3 Workday questions */}
                {QUESTIONS.map((q) => (
                  <div key={q.key} className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">{q.section}</p>
                      <p className="mt-0.5 text-sm font-semibold text-foreground">{q.prompt}</p>
                    </div>
                    <Textarea
                      rows={5}
                      value={form[q.key]}
                      onChange={(e) => setF(q.key, e.target.value)}
                      placeholder={q.placeholder}
                    />
                  </div>
                ))}

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
                  <Button type="submit" disabled={loading}>{editingId != null ? 'Save changes' : 'Save check-in'}</Button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
