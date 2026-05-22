
import { useMemo, useState, useRef } from "react"
import type { Skill, CreateSkillDTO } from "@/types/types"
import { emptySkillForm } from "@/types/types"
import { createSkill, updateSkill, deleteSkill } from "@/lib/actions"
import { exportSkillsToMarkdown } from "@/lib/utils/export-markdown"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

const PROFICIENCY_LABELS: Record<number, string> = {
  1: "1 — Beginner",
  2: "2 — Basic",
  3: "3 — Intermediate",
  4: "4 — Advanced",
  5: "5 — Expert",
}

const PROFICIENCY_COLORS: Record<number, string> = {
  1: "bg-gray-100 text-gray-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-yellow-100 text-yellow-800",
  4: "bg-orange-100 text-orange-800",
  5: "bg-green-100 text-green-800",
}

const PROFICIENCY_CHART_COLORS: Record<number, string> = {
  1: "#cbd5e1",
  2: "#bfdbfe",
  3: "#fef08a",
  4: "#fdba74",
  5: "#86efac",
}

const TIMEFRAME_OPTIONS = [
  { value: 7,   label: "Last 7 days" },
  { value: 30,  label: "Last 30 days" },
  { value: 90,  label: "Last 90 days" },
  { value: 365, label: "Last 12 months" },
]

// Pastel tag colours (Tailwind classes for badges)
const TAG_PALETTE = [
  "bg-purple-100 text-purple-700",
  "bg-cyan-100 text-cyan-700",
  "bg-pink-100 text-pink-700",
  "bg-lime-100 text-lime-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-indigo-100 text-indigo-700",
  "bg-rose-100 text-rose-700",
]

// Matching hex values for conic-gradient (same order as TAG_PALETTE)
const TAG_HEX_PALETTE = [
  "#e9d5ff", // purple
  "#a5f3fc", // cyan
  "#fbcfe8", // pink
  "#d9f99d", // lime
  "#fed7aa", // orange
  "#99f6e4", // teal
  "#c7d2fe", // indigo
  "#fecdd3", // rose
]

function tagIndex(tag: string) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) | 0
  return Math.abs(hash) % TAG_PALETTE.length
}

function tagColor(tag: string)    { return TAG_PALETTE[tagIndex(tag)] }
function tagHexColor(tag: string) { return TAG_HEX_PALETTE[tagIndex(tag)] }

type SortField = "none" | "proficiency" | "date"
type SortDirection = "asc" | "desc"
type ViewMode = "proficiency" | "tags"

type Props = { initialSkills: Skill[] }

// ─── Tag chip input ───────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("")
  const ref = useRef<HTMLInputElement>(null)

  function commit() {
    const next = input.split(",").map(t => t.trim()).filter(t => t && !tags.includes(t))
    if (next.length) onChange([...tags, ...next])
    setInput("")
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit() }
    if (e.key === "Backspace" && !input && tags.length) onChange(tags.slice(0, -1))
  }

  function remove(tag: string) { onChange(tags.filter(t => t !== tag)) }

  return (
    <div
      className="flex flex-wrap gap-1.5 rounded-md border bg-background px-3 py-2 cursor-text min-h-[2.25rem]"
      onClick={() => ref.current?.focus()}
    >
      {tags.map(t => (
        <span key={t} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(t)}`}>
          {t}
          <button type="button" onClick={() => remove(t)} className="hover:opacity-70">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={commit}
        placeholder={tags.length === 0 ? "Add tags (e.g. Java, CI/CD) — press Enter or comma" : ""}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

// ─── Skill card ───────────────────────────────────────────────────────────────

function SkillCard({ skill, onEdit, onDelete, loading }: {
  skill: Skill
  onEdit: () => void
  onDelete: () => void
  loading: boolean
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="font-medium">{skill.name}</p>
            {skill.date && <p className="text-sm text-muted-foreground">{skill.date}</p>}
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${PROFICIENCY_COLORS[skill.proficiency]}`}>
              {PROFICIENCY_LABELS[skill.proficiency]}
            </span>
            {skill.tags && skill.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {skill.tags.map(t => (
                  <span key={t} className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tagColor(t)}`}>{t}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={onDelete} disabled={loading}>Delete</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SkillsPage({ initialSkills }: Props) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills)
  const [form, setForm] = useState<CreateSkillDTO>(emptySkillForm())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [sortField, setSortField] = useState<SortField>("none")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [timeframeDays, setTimeframeDays] = useState<number>(30)
  const [viewMode, setViewMode] = useState<ViewMode>("proficiency")
  const [circleMode, setCircleMode] = useState<"proficiency" | "tags">("proficiency")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleField<K extends keyof CreateSkillDTO>(field: K, value: CreateSkillDTO[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError("Skill name is required"); return }
    setLoading(true); setError(null)
    try {
      if (editingId !== null) {
        const updated = await updateSkill(editingId, form)
        setSkills(prev => prev.map(s => s.id === updated.id ? updated : s).sort((a, b) => b.proficiency - a.proficiency))
        setEditingId(null)
      } else {
        const created = await createSkill(form)
        setSkills(prev => [...prev, created].sort((a, b) => b.proficiency - a.proficiency))
      }
      setForm(emptySkillForm())
    } catch {
      setError(editingId !== null ? "Failed to save changes" : "Failed to create skill")
    } finally {
      setLoading(false)
    }
  }

  function startEdit(skill: Skill) {
    setEditingId(skill.id!)
    setForm({ name: skill.name, proficiency: skill.proficiency, date: skill.date ?? "", tags: skill.tags ?? [] })
    setError(null)
  }

  function cancelEdit() { setEditingId(null); setForm(emptySkillForm()); setError(null) }

  async function handleDelete(id: number) {
    setLoading(true)
    try {
      await deleteSkill(id)
      setSkills(prev => prev.filter(s => s.id !== id))
    } catch { setError("Failed to delete skill") }
    finally { setLoading(false) }
  }

  const skillsWithValidDate = useMemo(
    () => skills.filter(s => s.date && !Number.isNaN(Date.parse(s.date))),
    [skills]
  )

  const recentSkills = useMemo(() => {
    const now = new Date()
    return skillsWithValidDate.filter(s => {
      const daysAgo = (now.getTime() - new Date(s.date!).getTime()) / 86400000
      return daysAgo >= 0 && daysAgo <= timeframeDays
    })
  }, [skillsWithValidDate, timeframeDays])

  const totalSkills = skills.length

  const proficiencyCounts = useMemo(
    () => [5, 4, 3, 2, 1].map(level => ({ level, count: skills.filter(s => s.proficiency === level).length })),
    [skills]
  )

  const proficiencySegments = useMemo(() =>
    totalSkills === 0
      ? proficiencyCounts.map(e => ({ ...e, percent: 0 }))
      : proficiencyCounts.map(e => ({ ...e, percent: (e.count / totalSkills) * 100 })),
    [proficiencyCounts, totalSkills]
  )

  const pieGradient = useMemo(() => {
    if (totalSkills === 0) return "rgba(0,0,0,0)"
    let offset = 0
    const stops = proficiencySegments
      .filter(s => s.count > 0)
      .map(s => { const start = offset; const end = offset + s.percent; offset = end; return `${PROFICIENCY_CHART_COLORS[s.level]} ${start.toFixed(2)}% ${end.toFixed(2)}%` })
      .join(", ")
    return `conic-gradient(${stops})`
  }, [proficiencySegments, totalSkills])

  // Tag breakdown for the circle — each tag's count as share of total tag usage
  const tagSegments = useMemo(() => {
    const counts = new Map<string, number>()
    for (const skill of skills) {
      for (const tag of skill.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0)
    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([tag, count]) => ({ tag, count, percent: total > 0 ? (count / total) * 100 : 0 }))
  }, [skills])

  const tagPieGradient = useMemo(() => {
    if (tagSegments.length === 0) return "rgba(0,0,0,0)"
    let offset = 0
    const stops = tagSegments.map(s => {
      const start = offset
      const end = offset + s.percent
      offset = end
      return `${tagHexColor(s.tag)} ${start.toFixed(2)}% ${end.toFixed(2)}%`
    }).join(", ")
    return `conic-gradient(${stops})`
  }, [tagSegments])

  const sortedSkills = useMemo(() => {
    const sorted = [...skills]
    if (sortField === "none") return sorted
    sorted.sort((a, b) => {
      let result = 0
      if (sortField === "proficiency") result = a.proficiency - b.proficiency
      else if (sortField === "date") result = (!a.date ? 1 : !b.date ? -1 : a.date.localeCompare(b.date))
      return sortDirection === "asc" ? result : -result
    })
    return sorted
  }, [skills, sortField, sortDirection])

  // Proficiency grouping (existing default view)
  const groupedByProficiency = useMemo(() =>
    [5, 4, 3, 2, 1]
      .map(level => ({ label: PROFICIENCY_LABELS[level], items: skills.filter(s => s.proficiency === level) }))
      .filter(g => g.items.length > 0),
    [skills]
  )

  // Tag grouping — a skill appears under each of its tags
  const groupedByTag = useMemo(() => {
    const tagMap = new Map<string, Skill[]>()
    const untagged: Skill[] = []
    for (const skill of skills) {
      if (!skill.tags || skill.tags.length === 0) { untagged.push(skill); continue }
      for (const tag of skill.tags) {
        if (!tagMap.has(tag)) tagMap.set(tag, [])
        tagMap.get(tag)!.push(skill)
      }
    }
    const groups = Array.from(tagMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, items]) => ({ tag, items }))
    if (untagged.length > 0) groups.push({ tag: "Untagged", items: untagged })
    return groups
  }, [skills])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    skills.forEach(s => s.tags?.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [skills])

  function renderSkillCard(skill: Skill) {
    return (
      <SkillCard
        key={skill.id}
        skill={skill}
        onEdit={() => startEdit(skill)}
        onDelete={() => handleDelete(skill.id!)}
        loading={loading}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Skills</h2>
          <p className="text-sm text-muted-foreground">Organize skills by proficiency or group them by tag.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setViewMode("proficiency")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "proficiency" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              By Proficiency
            </button>
            <button
              onClick={() => setViewMode("tags")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "tags" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              By Tag {allTags.length > 0 && <span className="ml-1 opacity-70">({allTags.length})</span>}
            </button>
          </div>

          {viewMode === "proficiency" && (
            <>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Sort</Label>
                <Select value={sortField} onValueChange={val => setSortField(val as SortField)}>
                  <SelectTrigger id="skillSortField"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="proficiency">Proficiency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={sortDirection} onValueChange={val => setSortDirection(val as SortDirection)}>
                <SelectTrigger id="skillSortDirection"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <Button variant="outline" onClick={() => exportSkillsToMarkdown(sortedSkills)} disabled={skills.length === 0}>
            Export to Markdown
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Skill activity</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New skills added in the selected timeframe</p>
                <p className="mt-2 text-3xl font-semibold">{recentSkills.length}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Timeframe</Label>
                <Select value={String(timeframeDays)} onValueChange={val => setTimeframeDays(Number(val))}>
                  <SelectTrigger id="skillTimeframe"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEFRAME_OPTIONS.map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Total skills tracked</p>
                <p className="mt-3 text-3xl font-semibold">{totalSkills}</p>
              </div>
              <div className="rounded-lg border bg-background p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Unique tags</p>
                <p className="mt-3 text-3xl font-semibold">{allTags.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>
                {circleMode === "proficiency" ? "Proficiency breakdown" : "Tag breakdown"}
              </CardTitle>
              <div className="flex rounded-lg border overflow-hidden shrink-0">
                <button
                  onClick={() => setCircleMode("proficiency")}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${circleMode === "proficiency" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  Proficiency
                </button>
                <button
                  onClick={() => setCircleMode("tags")}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${circleMode === "tags" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  Tags
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-center">
              <div
                className="relative flex h-40 w-40 items-center justify-center rounded-full border"
                style={{ backgroundImage: circleMode === "proficiency" ? pieGradient : tagPieGradient }}
              >
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-background">
                  <div className="text-center">
                    <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                      {circleMode === "proficiency" ? "Total" : "Tags"}
                    </p>
                    <p className="text-2xl font-semibold">
                      {circleMode === "proficiency" ? totalSkills : tagSegments.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {circleMode === "proficiency" ? (
              <div className="space-y-3">
                {proficiencySegments.map(seg => (
                  <div key={seg.level} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-block h-3.5 w-10 rounded-full" style={{ backgroundColor: PROFICIENCY_CHART_COLORS[seg.level] }} />
                      <p className="text-sm font-medium">{PROFICIENCY_LABELS[seg.level]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{seg.count} skills</span>
                      <span className="text-sm font-semibold">{Math.round(seg.percent)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : tagSegments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">No tags yet. Add tags to your skills to see the breakdown.</p>
            ) : (
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {tagSegments.map(seg => (
                  <div key={seg.tag} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-block h-3.5 w-10 rounded-full shrink-0" style={{ backgroundColor: tagHexColor(seg.tag) }} />
                      <p className="text-sm font-medium truncate">{seg.tag}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground">{seg.count} skill{seg.count !== 1 ? "s" : ""}</span>
                      <span className="text-sm font-semibold">{Math.round(seg.percent)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <Card>
        <CardHeader><CardTitle>{editingId !== null ? "Edit Skill" : "Add Skill"}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Skill Name *</Label>
                <Input id="name" value={form.name} onChange={e => handleField("name", e.target.value)} placeholder="e.g. React, Java, SQL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={form.date ?? ""} onChange={e => handleField("date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proficiency">Proficiency</Label>
                <Select value={String(form.proficiency)} onValueChange={val => handleField("proficiency", Number(val))}>
                  <SelectTrigger id="proficiency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{PROFICIENCY_LABELS[n]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tags</Label>
                <TagInput tags={form.tags ?? []} onChange={tags => handleField("tags", tags)} />
                <p className="text-xs text-muted-foreground">Press Enter or comma to add a tag. Backspace removes the last one.</p>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : editingId !== null ? "Save Changes" : "Add Skill"}</Button>
              {editingId !== null && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Skill list */}
      {skills.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No skills added yet. Use the form above to add your first skill.</p>
          </CardContent>
        </Card>
      ) : viewMode === "tags" ? (
        // ── Tag-grouped view ──────────────────────────────────────────────────
        <div className="space-y-8">
          {groupedByTag.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tags yet. Edit your skills to add tags.</p>
          ) : groupedByTag.map(({ tag, items }) => (
            <div key={tag}>
              <div className="flex items-center gap-3 mb-3">
                {tag !== "Untagged" ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tagColor(tag)}`}>{tag}</span>
                ) : (
                  <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Untagged</span>
                )}
                <span className="text-xs text-muted-foreground">{items.length} skill{items.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map(renderSkillCard)}
              </div>
            </div>
          ))}
        </div>
      ) : sortField === "none" ? (
        // ── Proficiency-grouped view (default) ────────────────────────────────
        <div className="space-y-6">
          {groupedByProficiency.map(({ label, items }) => (
            <div key={label}>
              <h2 className="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">{label}</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map(renderSkillCard)}</div>
            </div>
          ))}
        </div>
      ) : (
        // ── Flat sorted view ─────────────────────────────────────────────────
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sortedSkills.map(renderSkillCard)}
        </div>
      )}
    </div>
  )
}
