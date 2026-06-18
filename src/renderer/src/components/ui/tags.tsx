import { useRef, useState } from 'react'
import { X } from 'lucide-react'

// Pastel tag colours (Tailwind classes for badges)
const TAG_PALETTE = [
  'bg-purple-100 text-purple-700',
  'bg-cyan-100 text-cyan-700',
  'bg-pink-100 text-pink-700',
  'bg-lime-100 text-lime-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
]

// Matching hex values for conic-gradient (same order as TAG_PALETTE)
const TAG_HEX_PALETTE = [
  '#e9d5ff', // purple
  '#a5f3fc', // cyan
  '#fbcfe8', // pink
  '#d9f99d', // lime
  '#fed7aa', // orange
  '#99f6e4', // teal
  '#c7d2fe', // indigo
  '#fecdd3', // rose
]

function tagIndex(tag: string): number {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) | 0
  return Math.abs(hash) % TAG_PALETTE.length
}

export function tagColor(tag: string): string {
  return TAG_PALETTE[tagIndex(tag)]
}

export function tagHexColor(tag: string): string {
  return TAG_HEX_PALETTE[tagIndex(tag)]
}

// ─── Tag chip input ───────────────────────────────────────────────────────────

export function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  function commit() {
    const next = input.split(',').map((t) => t.trim()).filter((t) => t && !tags.includes(t))
    if (next.length) onChange([...tags, ...next])
    setInput('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
  }

  function remove(tag: string) { onChange(tags.filter((t) => t !== tag)) }

  return (
    <div
      className="flex min-h-[2.25rem] flex-wrap gap-1.5 rounded-md border bg-background px-3 py-2 cursor-text"
      onClick={() => ref.current?.focus()}
    >
      {tags.map((t) => (
        <span key={t} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(t)}`}>
          {t}
          <button type="button" onClick={(e) => { e.stopPropagation(); remove(t) }} className="hover:opacity-70">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        placeholder={tags.length === 0 ? 'Add tags (e.g. Java, AI) — press Enter or comma' : ''}
        className="min-w-[120px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
