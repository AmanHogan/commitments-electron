import { useState } from 'react'
import type {
  BusinessCommitmentOne,
  BusinessCommitmentOneFormState,
  ValueEntry
} from '@/types/types'
import { emptyBusinessCommitmentForm } from '@/types/types'
import {
  createCommitmentOne,
  updateBusinessCommitmentOne,
  deleteCommitmentOne
} from '@/lib/actions'
import { toFormState, toApiPayload } from '@/lib/mappers/businessCommitmentOneMapper'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select'
import { exportBcomm1ToMarkdown } from '@/lib/utils/export-markdown'
import DocComp from './ui/doc-comp'
import CardComp from './ui/card-comp'

const emptyForm = emptyBusinessCommitmentForm

type Props = {
  initialCommitments: BusinessCommitmentOne[]
}

export default function BusinessCommitmentsComp({ initialCommitments }: Props) {
  const [commitments, setCommitments] = useState<BusinessCommitmentOne[]>(initialCommitments)
  const [form, setForm] = useState<BusinessCommitmentOneFormState>(emptyForm())
  const [valueEntry, setValueEntry] = useState<ValueEntry>({ label: '', value: '' })

  const VALUE_CATEGORIES = [
    'Improved outcomes',
    'Increased efficiency',
    'Reduced risk/cost',
    'Enhanced customer experience',
    'Enhanced employee experience'
  ]

  const [_loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  function handleField(field: keyof BusinessCommitmentOneFormState, val: string) {
    setForm((prev) => ({ ...prev, [field]: val }))
  }

  function addValueEntry() {
    if (!valueEntry.label || !valueEntry.value) return
    setForm((prev) => ({ ...prev, valueEntryList: [...(prev.valueEntryList ?? []), valueEntry] }))
    setValueEntry({ label: '', value: '' })
  }

  function removeValueEntry(index: number) {
    setForm((prev) => ({
      ...prev,
      valueEntryList: prev.valueEntryList?.filter((_, i) => i !== index)
    }))
  }

  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editingId) {
        const updated = await updateBusinessCommitmentOne(editingId, toApiPayload(form))
        setCommitments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        setEditingId(null)
        setForm(emptyForm())
      } else {
        const created = await createCommitmentOne(toApiPayload(form))
        setCommitments((prev) => [...prev, created])
        setForm(emptyForm())
      }
    } catch {
      setError(editingId ? 'Failed to save changes' : 'Failed to create commitment')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(commitment: BusinessCommitmentOne) {
    setEditingId(commitment.id!)
    setForm(toFormState(commitment))
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm())
  }

  async function handleDelete(id: number) {
    try {
      await deleteCommitmentOne(id)
      setCommitments((prev) => prev.filter((c) => c.id !== id))
    } catch {
      setError('Failed to delete commitment')
    }
  }

  return (
    <div className="space-y-8">
      <DocComp
        cardTitle="Business Partner Impact"
        cardDescription="Deliver measurable business impact through your Business Partner assignment."
        goals="Share at least three accomplishments and clearly describe how each one added business value (e.g., improved outcomes, increased efficiency, reduced risk/cost, or enhanced customer/employee experience)."
        validationCriteria={[
          'Recorded at least three distinct accomplishments during Business Partner assignment.',
          'For each accomplishment: what you did, the problem/opportunity, who benefited, why it mattered, measurable impact, and value category.'
        ]}
        tips={[
          'Ask your Business Partners what key deliverables they expect this year.',
          'Think how your work ties to ATS transformational initiatives and 2026 priorities.'
        ]}
      ></DocComp>

      <CardComp
        title={editingId ? 'Edit BP Impact Commitment' : 'New  BP Impact Commitment'}
        description="Deliver measurable business impact through your Business Partner assignment."
        onCancel={cancelEdit}
        onSave={() => handleCreate()}
        onExportToMarkdown={() => exportBcomm1ToMarkdown(commitments)}
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Label>Work item</Label>
          <Input
            required
            className="w-full"
            placeholder="Work item *"
            value={form.workItem}
            onChange={(e) => handleField('workItem', e.target.value)}
          />

          <Label>Application context</Label>
          <Input
            placeholder="Application context"
            className="w-full"
            value={form.applicationContext}
            onChange={(e) => handleField('applicationContext', e.target.value)}
          />

          <Label>Description</Label>
          <Textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => handleField('description', e.target.value)}
            rows={2}
            className="w-full"
          />

          <Label>Problem / Opportunity</Label>
          <Textarea
            placeholder="Problem / Opportunity"
            value={form.problemOpportunity}
            onChange={(e) => handleField('problemOpportunity', e.target.value)}
            rows={2}
            className="w-full"
          />

          <Label>Who benefited</Label>
          <Textarea
            placeholder="Who benefited"
            value={form.whoBenefited}
            onChange={(e) => handleField('whoBenefited', e.target.value)}
            rows={2}
            className="w-full"
          />

          <Label>Impact</Label>
          <Textarea
            placeholder="Impact"
            value={form.impact}
            onChange={(e) => handleField('impact', e.target.value)}
            rows={2}
            className="w-full"
          />

          <Label>Alignment</Label>
          <Input
            placeholder="Alignment"
            className="w-full"
            value={form.alignment}
            onChange={(e) => handleField('alignment', e.target.value)}
          />

          <Label>Status notes</Label>
          <Textarea
            placeholder="Status notes"
            value={form.statusNotes}
            onChange={(e) => handleField('statusNotes', e.target.value)}
            rows={2}
            className="w-full"
          />

          <Label>Date started</Label>
          <Input
            className="w-full"
            type="date"
            value={form.started}
            onChange={(e) => handleField('started', e.target.value)}
          />

          <Label>Date completed</Label>
          <Input
            className="w-full"
            type="date"
            value={form.dateCompleted}
            onChange={(e) => handleField('dateCompleted', e.target.value)}
          />

          <div className="flex flex-col gap-4">
            <span className="text-sm font-medium">Value entries</span>
            {form.valueEntryList?.map((ve, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{ve.label}:</span>
                <span>{ve.value}</span>
                <button
                  type="button"
                  onClick={() => removeValueEntry(i)}
                  className="ml-auto text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select
                  value={valueEntry.label ?? ''}
                  onValueChange={(val) => setValueEntry((v) => ({ ...v, label: val }))}
                >
                  <SelectTrigger className="w-full rounded-[10px] border-[#4B5563]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="mt-2">
                    {VALUE_CATEGORIES.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Details</Label>
                <Textarea
                  placeholder="Describe the accomplishment and impact"
                  value={valueEntry.value}
                  onChange={(e) => setValueEntry((v) => ({ ...v, value: e.target.value }))}
                  rows={3}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={addValueEntry} className="rounded border px-3 py-2">
                  + Add
                </button>
              </div>
            </div>
          </div>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </CardComp>

      <div className="grid gap-4">
        {commitments.map((c) => (
          <Card key={c.id} className="shadow-sm">
            <CardHeader>
              <CardTitle>{c.workItem}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {c.applicationContext}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="mb-2 text-sm">{c.description}</p>
              <div className="text-xs text-muted-foreground">
                Started: {c.started ?? '-'} • Completed: {c.dateCompleted ?? '-'}
              </div>
            </CardContent>

            <CardFooter>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => startEdit(c)}
                  className="rounded border px-3 py-1 text-sm hover:bg-accent"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id!)}
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
