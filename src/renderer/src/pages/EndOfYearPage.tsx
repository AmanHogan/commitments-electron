import { useEffect, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { Plus, Pencil, Trash2, X, CalendarRange, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import type { EndOfYearReview, QuickAccomplishment, QuickAccomplishmentCategory, QAStatus } from '@/types/types'
import { QA_STATUSES } from '@/types/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { DocumentViewer } from '@/components/ui/document-viewer'
import { buildEndOfYearDoc, type ViewerDoc } from '@/lib/document-render'

// ─── Commitment templates ─────────────────────────────────────────────────────

const COMMITMENT_TEMPLATES: { key: keyof ReviewFormState & ('bcomm1Notes' | 'bcomm2Notes' | 'dcomm1Notes' | 'dcomm2Notes'); label: string; template: string }[] = [
  {
    key: 'bcomm1Notes',
    label: 'Business Partner Impact (#1)',
    template: `Commitment: Deliver valuable, measurable business impact through your Business Partner assignment.

Goals:
• Share at least three accomplishments that clearly describe how each one added business value (improved outcomes, increased efficiency, reduced risk/cost, or enhanced customer/employee experience).

Validation:
• Identified and recorded at least three distinct accomplishments during BP assignment.
• For each: what you did, the problem/opportunity, who benefited, why it mattered, measurable impact, and value category.`,
  },
  {
    key: 'bcomm2Notes',
    label: 'AT&T / TDP Program Impact (#2)',
    template: `Commitment: Build your personal brand by actively participating in TDP and AT&T opportunities beyond your primary Business Partner assignment.

Goals:
• Provide at least three examples of how you distinguished yourself and engaged within the TDP program.
• Attend and actively participate in TDP experience events throughout the year.

Validation:
• Documented at least three specific examples of how you strengthened your professional brand.
• Attended TDP experience events throughout the year with dates and participation details.`,
  },
  {
    key: 'dcomm1Notes',
    label: 'Development Commitment (#1)',
    template: `Commitment: Build track-aligned technical skills, AI capabilities, business knowledge, and leadership skills.

Areas of Focus:
• Technical training aligned to TDP track
• AI-focused training (via Growth Hub)
• Leadership/soft skills training
• Business/industry knowledge
• Advanced learning (Masters', Nanodegrees, Certifications…)

GrowthHub: Complete all required/assigned training. Review progress in each 1x1 with TDP AD.
Mandatory Training: All compliance, EH&S, Ask Yourself, and CSP courses.
Graduation Phase: All grad-phase milestones with TDP AD.

Validation:
• Track development progress including GrowthHub in monthly 1x1s with TDP AD.
• Document completed courses for 1x1s, reviews, progression submissions, and year-end reviews.`,
  },
  {
    key: 'dcomm2Notes',
    label: 'Innovation Commitment (#2)',
    template: `Commitment: Complete at least two TDP innovation events or hackathons per year.

Requirement: Two (2) events per year — one Jan–Jun, one Jul–Dec.

1H 2026 Options:
• Q2 TDP Hackathon (March–May)
• ATS Software Symposium (Mid-May)
• Intern Innovation Challenge Coach (June–July)
• Local Lab Project (Ongoing)

2H 2026 Options:
• Bounty Hunters (June / October)
• Q3 TDP Hackathon (Aug–Sept)
• Face the Floor (Oct–Nov)
• Local Lab Project (Ongoing)

Validation:
• Hackathons: End-to-end participation + final demo, confirmed by AD.
• Local Lab: Approved by National AD Leads — live demo, 1:1 demo, or recorded demo.
• IIC Coach: Patent submission with intern team.`,
  },
]

const QA_CATEGORIES: { key: QuickAccomplishmentCategory; label: string }[] = [
  { key: 'bcomm1', label: 'Business Partner Impact' },
  { key: 'bcomm2', label: 'TDP Program Impact' },
  { key: 'dcomm1', label: 'Development Commitment' },
  { key: 'dcomm2', label: 'Innovation Commitment' },
]

const STATUS_COLORS: Record<QAStatus, string> = {
  'Not Started': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'Exceeded Expectations': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewFormState = {
  title: string
  bcomm1Notes: string
  bcomm2Notes: string
  dcomm1Notes: string
  dcomm2Notes: string
}

type QaFormState = {
  category: QuickAccomplishmentCategory
  description: string
  dateFinished: string
  status: QAStatus
}

function emptyReviewForm(): ReviewFormState {
  return { title: '', bcomm1Notes: '', bcomm2Notes: '', dcomm1Notes: '', dcomm2Notes: '' }
}

function reviewFormFrom(r: EndOfYearReview): ReviewFormState {
  return { title: r.title, bcomm1Notes: r.bcomm1Notes, bcomm2Notes: r.bcomm2Notes, dcomm1Notes: r.dcomm1Notes, dcomm2Notes: r.dcomm2Notes }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  )
}

// ─── Commitment section with collapsible template ─────────────────────────────

function CommitmentSection({
  templateKey,
  label,
  template,
  value,
  onChange,
}: {
  templateKey: string
  label: string
  template: string
  value: string
  onChange: (v: string) => void
}) {
  const [tplOpen, setTplOpen] = useState(false)
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <button
          type="button"
          onClick={() => setTplOpen((p) => !p)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {tplOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {tplOpen ? 'Hide template' : 'View template'}
        </button>
      </div>
      {tplOpen && (
        <pre className="whitespace-pre-wrap rounded border border-border bg-muted px-3 py-2 text-xs text-muted-foreground font-sans leading-relaxed">
          {template}
        </pre>
      )}
      <Textarea
        key={templateKey}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your year-end self-assessment for this commitment…"
      />
    </div>
  )
}

// ─── Quick accomplishments tabbed panel ───────────────────────────────────────

function QuickAccomplishmentsPanel({
  accomplishments,
  onAdd,
  onEdit,
  onDelete,
}: {
  accomplishments: QuickAccomplishment[]
  onAdd: (qa: QaFormState) => Promise<void>
  onEdit: (id: number, qa: QaFormState) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [activeCategory, setActiveCategory] = useState<QuickAccomplishmentCategory>('bcomm1')
  const [addDesc, setAddDesc] = useState('')
  const [addDate, setAddDate] = useState('')
  const [addStatus, setAddStatus] = useState<QAStatus>('Completed')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editStatus, setEditStatus] = useState<QAStatus>('Completed')
  const [saving, setSaving] = useState(false)
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')

  const tabItems = accomplishments
    .filter((q) => q.category === activeCategory)
    .slice()
    .sort((a, b) => {
      // Items without a date sort to the bottom regardless of direction.
      const ad = a.dateFinished || ''
      const bd = b.dateFinished || ''
      if (!ad && !bd) return 0
      if (!ad) return 1
      if (!bd) return -1
      return sortDir === 'asc' ? ad.localeCompare(bd) : bd.localeCompare(ad)
    })

  function startEdit(qa: QuickAccomplishment) {
    setEditingId(qa.id)
    setEditDesc(qa.description)
    setEditDate(qa.dateFinished ?? '')
    setEditStatus(qa.status)
  }

  function cancelEdit() {
    setEditingId(null); setEditDesc(''); setEditDate(''); setEditStatus('Completed')
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!addDesc.trim()) return
    setSaving(true)
    try {
      await onAdd({ category: activeCategory, description: addDesc.trim(), dateFinished: addDate, status: addStatus })
      setAddDesc(''); setAddDate(''); setAddStatus('Completed')
    } finally { setSaving(false) }
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault()
    if (editingId == null || !editDesc.trim()) return
    setSaving(true)
    try {
      await onEdit(editingId, { category: activeCategory, description: editDesc.trim(), dateFinished: editDate, status: editStatus })
      cancelEdit()
    } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Quick Accomplishments</p>
          <p className="text-xs text-muted-foreground">One-sentence accomplishments per commitment — like Workday quick accomplishments. Persist across all reviews.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Sort by date</span>
          <Select value={sortDir} onValueChange={(v) => setSortDir(v as 'desc' | 'asc')}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest first</SelectItem>
              <SelectItem value="asc">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-border">
        {QA_CATEGORIES.map((cat) => {
          const count = accomplishments.filter((q) => q.category === cat.key).length
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => { setActiveCategory(cat.key); cancelEdit() }}
              className={`px-4 py-2 text-xs font-medium transition ${activeCategory === cat.key ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {cat.label}
              {count > 0 && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-b-lg border border-t-0 border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Accomplishment</th>
              <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Date Finished</th>
              <th className="px-4 py-2 text-xs font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Add row */}
            <tr className="border-t border-border bg-muted/20">
              <td className="px-3 py-2" colSpan={4}>
                <form onSubmit={(e) => void handleAdd(e)} className="flex flex-wrap items-center gap-2">
                  <input
                    className="flex-1 min-w-48 rounded border border-border bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    value={addDesc}
                    onChange={(e) => setAddDesc(e.target.value)}
                    placeholder="Add one-liner accomplishment…"
                    required
                  />
                  <input
                    type="date"
                    className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                  />
                  <Select value={addStatus} onValueChange={(v) => setAddStatus(v as QAStatus)}>
                    <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QA_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="submit" size="sm" disabled={saving || !addDesc.trim()}>
                    <Plus className="h-3.5 w-3.5" />Add
                  </Button>
                </form>
              </td>
            </tr>

            {tabItems.length === 0 ? (
              <tr className="border-t border-border">
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground italic">
                  No accomplishments yet for this commitment.
                </td>
              </tr>
            ) : tabItems.map((qa) => (
              <tr key={qa.id} className="border-t border-border">
                {editingId === qa.id ? (
                  <td colSpan={4} className="px-3 py-2">
                    <form onSubmit={(e) => void handleUpdate(e)} className="flex flex-wrap items-center gap-2">
                      <input
                        className="flex-1 min-w-48 rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        required
                        autoFocus
                      />
                      <input
                        type="date"
                        className="rounded border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                      <Select value={editStatus} onValueChange={(v) => setEditStatus(v as QAStatus)}>
                        <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {QA_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="submit" size="sm" disabled={saving}>Update</Button>
                      <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>Cancel</Button>
                    </form>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-2.5 text-sm">{qa.description}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{qa.dateFinished ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[qa.status]}`}>{qa.status}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-xs" onClick={() => startEdit(qa)}><Pencil className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => void onDelete(qa.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EndOfYearPage() {
  const [reviews, setReviews] = useState<EndOfYearReview[]>([])
  const [accomplishments, setAccomplishments] = useState<QuickAccomplishment[]>([])
  const [form, setForm] = useState<ReviewFormState>(emptyReviewForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [_activeTab, _setActiveTab] = useState<'assessment' | 'accomplishments'>('assessment')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewerDoc, setViewerDoc] = useState<ViewerDoc | null>(null)

  useEffect(() => {
    void window.api.endofyear.getAll().then((all) => setReviews(all as EndOfYearReview[]))
    void window.api.quickAccomplishments.getAll().then((all) => setAccomplishments(all as QuickAccomplishment[]))
  }, [])

  function openCreate() {
    setEditingId(null); setForm(emptyReviewForm()); setError(null); setModalOpen(true)
  }

  function openEdit(r: EndOfYearReview) {
    setEditingId(r.id); setForm(reviewFormFrom(r)); setError(null); setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false); setEditingId(null); setForm(emptyReviewForm()); setError(null)
  }

  function setF<K extends keyof ReviewFormState>(k: K, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    setLoading(true); setError(null)
    try {
      if (editingId != null) {
        const updated = await window.api.endofyear.update(editingId, form) as EndOfYearReview
        setReviews((p) => p.map((r) => (r.id === editingId ? updated : r)))
      } else {
        const created = await window.api.endofyear.create(form) as EndOfYearReview
        setReviews((p) => [created, ...p])
      }
      closeModal()
    } catch {
      setError('Could not save.')
    } finally { setLoading(false) }
  }

  async function handleDelete(id: number) {
    setLoading(true)
    try {
      await window.api.endofyear.delete(id)
      setReviews((p) => p.filter((r) => r.id !== id))
      if (editingId === id) closeModal()
    } finally { setLoading(false) }
  }

  // Quick accomplishment handlers (global pool)
  async function addQa(qa: QaFormState) {
    const created = await window.api.quickAccomplishments.create(qa) as QuickAccomplishment
    setAccomplishments((p) => [created, ...p])
  }

  async function editQa(id: number, qa: QaFormState) {
    const updated = await window.api.quickAccomplishments.update(id, qa) as QuickAccomplishment
    setAccomplishments((p) => p.map((q) => (q.id === id ? updated : q)))
  }

  async function deleteQa(id: number) {
    await window.api.quickAccomplishments.delete(id)
    setAccomplishments((p) => p.filter((q) => q.id !== id))
  }

  function formatDate(iso: string) {
    try { return new Date(iso).toLocaleDateString() } catch { return iso }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">End-of-Year Review</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Write your year-end self-assessment for each commitment and track quick accomplishments.
          Quick accomplishments are a global pool — they persist independently of individual review documents.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Button onClick={openCreate}><Plus className="h-4 w-4" />New review</Button>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <CalendarRange className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No end-of-year reviews yet. Click <strong>New review</strong> to start.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold">{r.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Created {formatDate(r.createdAt)} · Updated {formatDate(r.updatedAt)}</p>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    {COMMITMENT_TEMPLATES.map((t) => {
                      const val = r[t.key]
                      return (
                        <p key={t.key} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{t.label.split(' (#')[0]}: </span>
                          {val ? `${val.slice(0, 60)}${val.length > 60 ? '…' : ''}` : <em className="opacity-50">no response</em>}
                        </p>
                      )
                    })}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon-xs" aria-label="View" onClick={() => setViewerDoc(buildEndOfYearDoc(r))}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon-xs" onClick={() => void handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Global quick accomplishments — shown below the list, always visible */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <QuickAccomplishmentsPanel
          accomplishments={accomplishments}
          onAdd={addQa}
          onEdit={editQa}
          onDelete={deleteQa}
        />
      </div>

      <DocumentViewer doc={viewerDoc} open={viewerDoc != null} onClose={() => setViewerDoc(null)} />

      {/* Review modal */}
      <Dialog.Root open={modalOpen} onOpenChange={(v) => { if (!v) closeModal() }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-card shadow-xl focus:outline-none"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <Dialog.Title className="text-lg font-semibold">
                {editingId != null ? 'Edit review' : 'New end-of-year review'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Close"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>

            <form onSubmit={(e) => void handleSave(e)} className="flex min-h-0 flex-1 flex-col">
              <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
                <Field label="Title">
                  <Input
                    value={form.title}
                    onChange={(e) => setF('title', e.target.value)}
                    placeholder="e.g. End-of-Year Review 2026"
                    required
                  />
                </Field>

                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Write your self-assessment for each commitment. Click "View template" to see the full commitment details.
                </p>

                {COMMITMENT_TEMPLATES.map((t) => (
                  <CommitmentSection
                    key={t.key}
                    templateKey={t.key}
                    label={t.label}
                    template={t.template}
                    value={form[t.key]}
                    onChange={(v) => setF(t.key, v)}
                  />
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
                  <Button type="submit" disabled={loading}>{editingId != null ? 'Save changes' : 'Save review'}</Button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
