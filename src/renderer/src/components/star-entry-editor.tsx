import { useState } from 'react'
import { ChevronUp, ChevronDown, Eye, EyeOff, Trash2, GripVertical } from 'lucide-react'
import type { StarEntry } from '@/types/types'
import { starToParagraph, starCharCount } from '@/lib/star'
import { Textarea } from './ui/textarea'

interface StarFieldProps {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
}

function StarField({ label, hint, value, onChange }: StarFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</label>
        <span className="text-xs text-muted-foreground">{value.length} chars</span>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="resize-y text-sm"
      />
    </div>
  )
}

interface Props {
  entry: StarEntry
  index?: number
  onChange: (updated: StarEntry) => void
  onRemove: () => void
}

export default function StarEntryEditor({ entry, index, onChange, onRemove }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [preview, setPreview] = useState(false)

  function set(field: keyof StarEntry, value: string) {
    onChange({ ...entry, [field]: value })
  }

  const totalChars = starCharCount(entry)
  const sourceLabel = entry.sourceType !== 'manual' ? `imported · ${entry.sourceType}` : 'manual'

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {index !== undefined ? `${index + 1}. ` : ''}{entry.title || 'Untitled'}
        </span>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{sourceLabel}</span>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="rounded p-1 hover:bg-accent"
          title={preview ? 'Hide preview' : 'Show paragraph preview'}
        >
          {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded p-1 hover:bg-accent"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
          title="Remove"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-3 p-3">
          {/* Title field */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</label>
            <input
              type="text"
              value={entry.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Descriptive title for this story"
              className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <StarField
            label="Situation"
            hint="What was the context, problem, or opportunity?"
            value={entry.situation}
            onChange={(v) => set('situation', v)}
          />
          <StarField
            label="Task"
            hint="What was your specific role or responsibility?"
            value={entry.task}
            onChange={(v) => set('task', v)}
          />
          <StarField
            label="Action"
            hint="What steps did you take?"
            value={entry.action}
            onChange={(v) => set('action', v)}
          />
          <StarField
            label="Result"
            hint="What was the measurable outcome or impact?"
            value={entry.result}
            onChange={(v) => set('result', v)}
          />

          {preview && (
            <div className="rounded-md border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide">Paragraph preview</p>
              <p className="leading-relaxed">{starToParagraph(entry) || <em>Nothing to preview yet.</em>}</p>
            </div>
          )}

          <div className="flex justify-end">
            <span className="text-xs text-muted-foreground">{totalChars} / 4,000 chars</span>
          </div>
        </div>
      )}
    </div>
  )
}
