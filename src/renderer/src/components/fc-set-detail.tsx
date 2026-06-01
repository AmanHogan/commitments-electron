import { useState, useId, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { FlashCard, FlashCardSet, FcSkill } from "@/types/types"
import { Markdown } from "@/components/markdown"
import { exportSetToText, exportSetToMarkdownNotes } from "@/lib/utils/fc-export-markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Star, Pencil, Trash2, Plus, GripVertical, ChevronLeft, ChevronRight,
  RotateCcw, Download, Upload, FileText, ChevronDown, Check, X,
  BookOpen, GraduationCap, BarChart2, RefreshCw,
} from "lucide-react"
import { ImportCardsPanel, type ParsedCard } from "@/components/import-cards-panel"
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

const PROF_LABELS: Record<number, string> = { 1: "Novice", 2: "Beginner", 3: "Intermediate", 4: "Advanced", 5: "Expert" }

interface InsertFormProps {
  groups: string[]
  onInsert: (term: string, def: string, group: string, hint: string) => Promise<void>
  onCancel: () => void
}

function InsertCardForm({ groups, onInsert, onCancel }: InsertFormProps) {
  const [term, setTerm] = useState("")
  const [def, setDef] = useState("")
  const [group, setGroup] = useState("")
  const [hint, setHint] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!term.trim() || !def.trim()) return
    setSaving(true)
    await onInsert(term, def, group, hint)
    setSaving(false)
  }

  return (
    <div className="border border-primary/40 rounded-lg bg-primary/5 p-3 space-y-2">
      <p className="text-xs font-semibold text-primary">Insert card here</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Term *</Label>
          <Textarea autoFocus value={term} onChange={e => setTerm(e.target.value)} rows={3} placeholder="Term" className="text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Definition *</Label>
          <Textarea value={def} onChange={e => setDef(e.target.value)} rows={3} placeholder="Definition" className="text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Group</Label>
          <Input list="insert-groups" value={group} onChange={e => setGroup(e.target.value)} className="h-8 text-sm" placeholder="Group (optional)" />
          <datalist id="insert-groups">{groups.map(g => <option key={g} value={g} />)}</datalist>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hint</Label>
          <Input value={hint} onChange={e => setHint(e.target.value)} className="h-8 text-sm" placeholder="Hint (optional)" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving || !term.trim() || !def.trim()}>
          <Check className="h-3 w-3 mr-1" /> {saving ? "Inserting..." : "Insert Card"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}><X className="h-3 w-3 mr-1" /> Cancel</Button>
      </div>
    </div>
  )
}

interface SortableCardProps {
  card: FlashCard
  groups: string[]
  insertOpen: boolean
  onToggleInsert: () => void
  onInsert: (term: string, def: string, group: string, hint: string) => Promise<void>
  onStar: (id: number) => void
  onDelete: (id: number) => void
  onUpdate: (id: number, data: Partial<FlashCard>) => Promise<void>
}

function SortableCard({ card, groups, insertOpen, onToggleInsert, onInsert, onStar, onDelete, onUpdate }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const [editing, setEditing] = useState(false)
  const [term, setTerm] = useState(card.term)
  const [definition, setDefinition] = useState(card.definition)
  const [groupName, setGroupName] = useState(card.groupName ?? "")
  const [hint, setHint] = useState(card.hint ?? "")
  const [saving, setSaving] = useState(false)

  async function saveEdit() {
    setSaving(true)
    await onUpdate(card.id, { term, definition, groupName: groupName || undefined, hint: hint || undefined })
    setSaving(false)
    setEditing(false)
  }

  function cancelEdit() {
    setTerm(card.term); setDefinition(card.definition)
    setGroupName(card.groupName ?? ""); setHint(card.hint ?? "")
    setEditing(false)
  }

  return (
    <>
      <div ref={setNodeRef} style={style} className="border rounded-lg bg-card">
        {editing ? (
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Term</Label>
                <Textarea value={term} onChange={e => setTerm(e.target.value)} rows={3} className="text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Definition</Label>
                <Textarea value={definition} onChange={e => setDefinition(e.target.value)} rows={3} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Group</Label>
                <Input list={`groups-${card.id}`} value={groupName} onChange={e => setGroupName(e.target.value)} className="h-8 text-sm" placeholder="Group name" />
                <datalist id={`groups-${card.id}`}>{groups.map(g => <option key={g} value={g} />)}</datalist>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hint</Label>
                <Input value={hint} onChange={e => setHint(e.target.value)} className="h-8 text-sm" placeholder="Optional hint" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveEdit} disabled={saving}><Check className="h-3 w-3 mr-1" /> {saving ? "Saving..." : "Save"}</Button>
              <Button size="sm" variant="outline" onClick={cancelEdit}><X className="h-3 w-3 mr-1" /> Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-4">
            <button {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0" title="Drag to reorder">
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 grid grid-cols-2 gap-4 min-w-0 min-h-[5rem]">
              <div className="text-sm">
                <Markdown>{card.term}</Markdown>
                {card.hint && <p className="text-xs text-muted-foreground mt-1 italic">Hint: {card.hint}</p>}
              </div>
              <div className="text-sm text-muted-foreground"><Markdown>{card.definition}</Markdown></div>
            </div>
            <div className="flex items-center gap-1">
              {card.groupName && <Badge variant="outline" className="text-xs">{card.groupName}</Badge>}
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onStar(card.id)}>
                <Star className={`h-3.5 w-3.5 ${card.starred ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditing(true)}><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-destructive" onClick={() => onDelete(card.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        )}
      </div>
      <div className="group relative h-7 flex items-center">
        <div className="absolute inset-x-0 h-px bg-transparent group-hover:bg-border transition-colors" />
        <button
          onClick={onToggleInsert}
          className={`absolute left-1/2 -translate-x-1/2 z-10 h-6 w-6 rounded-full bg-background border-2 flex items-center justify-center transition-all
            ${insertOpen ? "border-primary text-primary opacity-100 rotate-45" : "border-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-primary hover:text-primary hover:scale-110"}`}
          title={insertOpen ? "Close" : "Insert card here"}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {insertOpen && <InsertCardForm groups={groups} onInsert={onInsert} onCancel={onToggleInsert} />}
    </>
  )
}

function CircleProgress({ value, total, size = 160, color = "#22c55e" }: { value: number; total: number; size?: number; color?: string }) {
  const sw = 14, r = (size - sw * 2) / 2, circ = 2 * Math.PI * r
  const pct = total > 0 ? value / total : 0
  const offset = circ * (1 - pct)
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={sw} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x={size / 2} y={size / 2 - 10} textAnchor="middle" fontSize="26" fontWeight="700" fill="currentColor">{Math.round(pct * 100)}%</text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fontSize="13" fill="#6b7280">{value} / {total}</text>
    </svg>
  )
}

interface Props {
  set: FlashCardSet
  skills: FcSkill[]
}

export function SetDetailClient({ set: initialSet, skills: initialSkills }: Props) {
  const navigate = useNavigate()
  const dndId = useId()

  const [set, setSet] = useState(initialSet)
  const [cards, setCards] = useState(initialSet.flashCards ?? [])
  const [skills, setSkills] = useState(initialSkills)

  const [studyMode, setStudyMode] = useState(false)
  const [studyGroup, setStudyGroup] = useState<string | null>(null)
  const [studyIdx, setStudyIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [studyReversed, setStudyReversed] = useState(false)
  const [trackingOn, setTrackingOn] = useState(false)
  const [knownIds, setKnownIds] = useState<Set<number>>(new Set())
  const [stillIds, setStillIds] = useState<Set<number>>(new Set())
  const [studyFilter, setStudyFilter] = useState<number[] | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  const [editingSet, setEditingSet] = useState(false)
  const [setTitle, setSetTitle] = useState(set.title)
  const [setDesc, setSetDesc] = useState(set.description ?? "")
  const [setTopic, setSetTopic] = useState(set.topic ?? "")
  const [setTagInput, setSetTagInput] = useState("")
  const [setTags, setSetTags] = useState(set.tags ?? [])
  const [savingSet, setSavingSet] = useState(false)

  const [addingCard, setAddingCard] = useState(false)
  const [newTerm, setNewTerm] = useState("")
  const [newDef, setNewDef] = useState("")
  const [newGroup, setNewGroup] = useState("")
  const [newHint, setNewHint] = useState("")
  const [insertingAtIndex, setInsertingAtIndex] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)
  const [skillsOpen, setSkillsOpen] = useState(false)

  const [newSkillName, setNewSkillName] = useState("")
  const [newSkillProf, setNewSkillProf] = useState(3)
  const [newSkillDate, setNewSkillDate] = useState("")
  const [addingSkill, setAddingSkill] = useState(false)
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null)
  const [editSkillName, setEditSkillName] = useState("")
  const [editSkillProf, setEditSkillProf] = useState(3)
  const [editSkillDate, setEditSkillDate] = useState("")

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const groups = Array.from(new Set(cards.map(c => c.groupName).filter(Boolean))) as string[]
  const studyCards = studyFilter !== null
    ? cards.filter(c => studyFilter.includes(c.id))
    : studyGroup ? cards.filter(c => c.groupName === studyGroup) : cards

  // True when there's study progress worth resuming
  const hasActiveSession = knownIds.size > 0 || stillIds.size > 0 || studyIdx > 0

  function startStudy(group?: string) {
    setStudyGroup(group ?? null); setStudyFilter(null); setStudyIdx(0)
    setFlipped(false); setStudyMode(true); setKnownIds(new Set())
    setStillIds(new Set()); setShowSummary(false)
    window.api.fcSets.study(set.id).catch(() => {})
  }

  function resumeStudy() {
    // Re-enter study mode without touching any progress state
    setStudyMode(true)
  }

  function nextCard() { setFlipped(false); setStudyIdx(i => Math.min(i + 1, studyCards.length - 1)) }
  function prevCard() { setFlipped(false); setStudyIdx(i => Math.max(i - 1, 0)) }
  function resetStudy() { setStudyIdx(0); setFlipped(false) }

  function markCard(cardId: number, known: boolean) {
    if (known) {
      setKnownIds(s => new Set([...s, cardId]))
      setStillIds(s => { const n = new Set(s); n.delete(cardId); return n })
    } else {
      setStillIds(s => new Set([...s, cardId]))
      setKnownIds(s => { const n = new Set(s); n.delete(cardId); return n })
    }
    if (studyIdx < studyCards.length - 1) { setTimeout(() => nextCard(), 280) }
    else { setTimeout(() => setShowSummary(true), 350) }
  }

  function continueStillLearning() {
    setStudyFilter([...stillIds]); setKnownIds(new Set()); setStillIds(new Set())
    setStudyIdx(0); setFlipped(false); setShowSummary(false)
  }

  async function saveSet() {
    setSavingSet(true)
    try {
      const updated = await window.api.fcSets.update(set.id, { title: setTitle, description: setDesc || undefined, topic: setTopic || undefined, tags: setTags }) as FlashCardSet
      setSet(updated); setEditingSet(false)
    } finally { setSavingSet(false) }
  }

  async function handleUpdate(cardId: number, data: Partial<FlashCard>) {
    const updated = await window.api.fcCards.update(set.id, cardId, data) as FlashCard
    setCards(cs => cs.map(c => c.id === cardId ? { ...c, ...updated } : c))
  }

  async function handleStar(cardId: number) {
    const updated = await window.api.fcCards.toggleStar(set.id, cardId) as FlashCard
    setCards(cs => cs.map(c => c.id === cardId ? { ...c, starred: updated.starred } : c))
  }

  async function handleDelete(cardId: number) {
    if (!confirm("Delete this card?")) return
    await window.api.fcCards.delete(set.id, cardId)
    setCards(cs => cs.filter(c => c.id !== cardId))
  }

  async function handleAddCard() {
    if (!newTerm.trim() || !newDef.trim()) return
    const card = await window.api.fcCards.create(set.id, {
      term: newTerm, definition: newDef, groupName: newGroup || undefined,
      hint: newHint || undefined, sortOrder: cards.length, starred: false,
    }) as FlashCard
    setCards(cs => [...cs, card])
    setNewTerm(""); setNewDef(""); setNewGroup(""); setNewHint("")
    setAddingCard(false)
  }

  async function handleInsertBetween(afterIndex: number, term: string, definition: string, groupName: string, hint: string) {
    const insertSortOrder = afterIndex + 1
    const card = await window.api.fcCards.create(set.id, {
      term, definition, groupName: groupName || undefined,
      hint: hint || undefined, sortOrder: insertSortOrder, starred: false,
    }) as FlashCard
    const newCards = [
      ...cards.slice(0, insertSortOrder),
      { ...card, sortOrder: insertSortOrder },
      ...cards.slice(insertSortOrder).map((c, i) => ({ ...c, sortOrder: insertSortOrder + 1 + i })),
    ]
    setCards(newCards); setInsertingAtIndex(null)
    await Promise.all(newCards.slice(insertSortOrder + 1).map(c =>
      window.api.fcCards.update(set.id, c.id, { sortOrder: c.sortOrder }).catch(() => {})
    ))
  }

  async function handleBulkImport(parsedCards: ParsedCard[]) {
    const payload = parsedCards.map((c, i) => ({
      term: c.term, definition: c.definition, groupName: c.groupName,
      hint: c.hint, sortOrder: cards.length + i, starred: false,
    }))
    const created = await window.api.fcCards.createBulk(set.id, payload) as FlashCard[]
    setCards(cs => [...cs, ...created]); setImporting(false)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = cards.findIndex(c => c.id === active.id)
    const newIndex = cards.findIndex(c => c.id === over.id)
    const reordered = arrayMove(cards, oldIndex, newIndex)
    setCards(reordered)
    await Promise.all(reordered.map((card, i) =>
      window.api.fcCards.update(set.id, card.id, { sortOrder: i }).catch(() => {})
    ))
  }

  async function handleAddSkill() {
    if (!newSkillName.trim()) return
    setAddingSkill(true)
    try {
      const skill = await window.api.fcSkills.create({ name: newSkillName, proficiency: newSkillProf, date: newSkillDate || undefined, flashCardSetId: set.id }) as FcSkill
      setSkills(ss => [...ss, skill]); setNewSkillName(""); setNewSkillProf(3); setNewSkillDate("")
    } finally { setAddingSkill(false) }
  }

  function startEditSkill(skill: FcSkill) {
    setEditingSkillId(skill.id); setEditSkillName(skill.name)
    setEditSkillProf(skill.proficiency); setEditSkillDate(skill.date ?? "")
  }

  async function handleSaveSkill(skillId: number) {
    const updated = await window.api.fcSkills.update(skillId, { name: editSkillName, proficiency: editSkillProf, date: editSkillDate || undefined, flashCardSetId: set.id }) as FcSkill
    setSkills(ss => ss.map(s => s.id === skillId ? updated : s))
    setEditingSkillId(null)
  }

  async function handleDeleteSkill(skillId: number) {
    await window.api.fcSkills.delete(skillId)
    setSkills(ss => ss.filter(s => s.id !== skillId))
  }

  async function handleDeleteSet() {
    if (!confirm(`Delete "${set.title}"? This cannot be undone.`)) return
    await window.api.fcSets.delete(set.id)
    navigate("/flashcards/sets")
  }

  useEffect(() => {
    if (!studyMode || showSummary) return
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.target instanceof HTMLButtonElement) return
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped(f => !f) }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); nextCard() }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); prevCard() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [studyMode, showSummary, studyIdx, studyCards.length])

  if (studyMode) {
    const current = studyCards[studyIdx]
    const reviewedCount = knownIds.size + stillIds.size
    const knownCount = knownIds.size
    const stillCount = stillIds.size

    if (showSummary) {
      const notReviewed = studyCards.length - reviewedCount
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setStudyMode(false)}>← Back to set</Button>
          </div>
          <div className="flex flex-col items-center gap-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-center mb-1">Session Complete!</h2>
              <p className="text-muted-foreground text-center text-sm">{studyCards.length} card{studyCards.length !== 1 ? "s" : ""} reviewed</p>
            </div>
            <CircleProgress value={knownCount} total={studyCards.length} size={180}
              color={knownCount / studyCards.length >= 0.8 ? "#22c55e" : knownCount / studyCards.length >= 0.5 ? "#eab308" : "#ef4444"} />
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-green-500" /><span className="font-medium text-green-600">{knownCount} Know it</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-red-400" /><span className="font-medium text-red-500">{stillCount} Still learning</span></div>
              {notReviewed > 0 && <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-muted-foreground/40" /><span className="text-muted-foreground">{notReviewed} skipped</span></div>}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {stillCount > 0 && <Button onClick={continueStillLearning}><RefreshCw className="h-4 w-4 mr-1.5" />Study {stillCount} still learning</Button>}
              <Button variant="outline" onClick={() => { setKnownIds(new Set()); setStillIds(new Set()); setStudyIdx(0); setFlipped(false); setStudyFilter(null); setShowSummary(false) }}>
                <RotateCcw className="h-4 w-4 mr-1.5" /> Restart all
              </Button>
              <Button variant="ghost" onClick={() => setStudyMode(false)}>Back to set</Button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setStudyMode(false)}>← Back to set</Button>
          {trackingOn && reviewedCount > 0 ? (
            <div className="flex-1 min-w-32 max-w-48 space-y-0.5">
              <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${(knownCount / studyCards.length) * 100}%` }} />
                <div className="bg-red-400 h-full transition-all duration-300" style={{ width: `${(stillCount / studyCards.length) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">{knownCount} ✓ · {stillCount} ✗ · {studyCards.length - reviewedCount} left</p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{studyGroup ? `${studyGroup} · ` : ""}{studyIdx + 1} / {studyCards.length}</span>
          )}
          <div className="flex items-center gap-2">
            <Button variant={studyReversed ? "default" : "outline"} size="sm" onClick={() => { setStudyReversed(r => !r); setFlipped(false) }}>
              ⇄ {studyReversed ? "Def → Term" : "Term → Def"}
            </Button>
            <button role="switch" aria-checked={trackingOn} onClick={() => setTrackingOn(t => !t)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${trackingOn ? "bg-primary" : "bg-muted-foreground/30"}`}>
              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${trackingOn ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">Track progress</span>
          </div>
        </div>

        {trackingOn && <p className="text-center text-xs text-muted-foreground">Card {studyIdx + 1} of {studyCards.length}</p>}

        {current ? (
          <div role="button" tabIndex={0} onClick={() => setFlipped(f => !f)} onKeyDown={e => e.key === " " || e.key === "Enter" ? setFlipped(f => !f) : undefined}
            className="cursor-pointer select-none" style={{ perspective: "1200px" }} title="Click or press Space to flip">
            <div style={{ transformStyle: "preserve-3d", transition: "transform 0.45s cubic-bezier(0.4, 0.2, 0.2, 1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", position: "relative" }}>
              <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                className="w-full min-h-80 max-h-[70vh] overflow-y-auto border rounded-xl p-10 flex flex-col items-center justify-center text-center bg-card shadow-sm">
                <Badge variant="outline" className="text-xs mb-4">{studyReversed ? "Definition" : "Term"}</Badge>
                <div className="text-xl w-full"><Markdown>{studyReversed ? current.definition : current.term}</Markdown></div>
                {!studyReversed && current.hint && <p className="text-sm text-muted-foreground italic mt-3">Hint: {current.hint}</p>}
                <p className="text-xs text-muted-foreground mt-4 opacity-60">Click or press Space to flip</p>
              </div>
              <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                className="absolute inset-0 overflow-y-auto border rounded-xl p-10 flex flex-col items-center justify-center text-center bg-accent/30 shadow-sm">
                <Badge variant="secondary" className="text-xs mb-4">{studyReversed ? "Term" : "Definition"}</Badge>
                <div className="text-xl w-full"><Markdown>{studyReversed ? current.term : current.definition}</Markdown></div>
                {studyReversed && current.hint && <p className="text-sm text-muted-foreground italic mt-3">Hint: {current.hint}</p>}
              </div>
            </div>
          </div>
        ) : (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No cards in this group.</CardContent></Card>
        )}

        {trackingOn && current && (
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" variant="outline"
              className={`gap-2 border-2 hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 ${stillIds.has(current.id) ? "border-red-400 bg-red-50 text-red-600 dark:bg-red-950" : ""}`}
              onClick={() => markCard(current.id, false)}>
              <X className="h-5 w-5" /> Still learning
            </Button>
            <Button size="lg"
              className={`gap-2 border-2 ${knownIds.has(current.id) ? "bg-green-600 hover:bg-green-700 border-green-600" : "bg-green-500 hover:bg-green-600 border-green-500"}`}
              onClick={() => markCard(current.id, true)}>
              <Check className="h-5 w-5" /> Know it
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={prevCard} disabled={studyIdx === 0}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={resetStudy}><RotateCcw className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={nextCard} disabled={studyIdx >= studyCards.length - 1}><ChevronRight className="h-4 w-4" /></Button>
          {trackingOn && reviewedCount === studyCards.length && (
            <Button size="sm" onClick={() => setShowSummary(true)}><BarChart2 className="h-4 w-4 mr-1" /> See results</Button>
          )}
        </div>
        {current && (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => handleStar(current.id)}>
              <Star className={`h-4 w-4 mr-1 ${current.starred ? "fill-yellow-500 text-yellow-500" : ""}`} />
              {current.starred ? "Unstar" : "Star"}
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editingSet ? (
            <div className="space-y-3">
              <Input value={setTitle} onChange={e => setSetTitle(e.target.value)} className="text-xl font-bold h-auto py-1" />
              <Textarea value={setDesc} onChange={e => setSetDesc(e.target.value)} placeholder="Description" rows={2} className="text-sm" />
              <Input value={setTopic} onChange={e => setSetTopic(e.target.value)} placeholder="Topic" className="h-8 text-sm" />
              <div className="flex gap-2">
                <Input value={setTagInput} onChange={e => setSetTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const t = setTagInput.trim(); if (t && !setTags.includes(t)) setSetTags([...setTags, t]); setSetTagInput("") } }}
                  placeholder="Add tag, press Enter" className="h-8 text-sm" />
              </div>
              {setTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {setTags.map(t => <Badge key={t} variant="secondary" className="cursor-pointer text-xs" onClick={() => setSetTags(setTags.filter(x => x !== t))}>{t} ×</Badge>)}
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={saveSet} disabled={savingSet}>{savingSet ? "Saving..." : "Save"}</Button>
                <Button size="sm" variant="outline" onClick={() => setEditingSet(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold">{set.title}</h1>
              {set.topic && <p className="text-sm text-muted-foreground">{set.topic}</p>}
              {set.description && <p className="text-sm text-muted-foreground mt-1">{set.description}</p>}
              {(set.tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {set.tags!.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditingSet(!editingSet)}><Pencil className="h-4 w-4 mr-1" /> Edit</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Export <ChevronDown className="h-3 w-3 ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Export as</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportSetToText(set.title, cards)}>
                <Download className="h-3.5 w-3.5 mr-2 shrink-0" />
                <div><div className="text-sm">Flashcard format</div><div className="text-xs text-muted-foreground">.txt · Quizlet-compatible</div></div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportSetToMarkdownNotes({ ...set, flashCards: cards })}>
                <FileText className="h-3.5 w-3.5 mr-2 shrink-0" />
                <div><div className="text-sm">Notes</div><div className="text-xs text-muted-foreground">.md · Readable markdown</div></div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" onClick={handleDeleteSet}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{cards.length} cards</span><span>·</span><span>{set.timesStudied} study sessions</span>
      </div>

      {/* ── Study row ── */}
      <div className="flex items-center gap-3 flex-wrap border rounded-lg px-4 py-3 bg-card">
        <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
        {cards.length === 0 ? (
          <span className="text-sm text-muted-foreground">Add cards below to start studying.</span>
        ) : (
          <>
            {hasActiveSession && (
              <>
                <Button size="sm" onClick={resumeStudy}>
                  ▶ Resume
                  <span className="ml-1.5 text-xs opacity-75">
                    ({knownIds.size}✓ {stillIds.size}✗)
                  </span>
                </Button>
                <span className="text-muted-foreground text-xs">·</span>
              </>
            )}
            <Button size="sm" variant={hasActiveSession ? "outline" : "default"} onClick={() => startStudy()}>
              {hasActiveSession ? "New session" : `Study all ${cards.length} cards`}
            </Button>
            {groups.map(g => (
              <Button key={g} variant="outline" size="sm" onClick={() => startStudy(g)}>
                {g} <span className="ml-1 text-muted-foreground">({cards.filter(c => c.groupName === g).length})</span>
              </Button>
            ))}
          </>
        )}
      </div>

      {/* ── Skills collapsible ── */}
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => setSkillsOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-card hover:bg-accent/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span>Skills</span>
            {skills.length > 0 && <span className="text-xs text-muted-foreground">({skills.length})</span>}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${skillsOpen ? "rotate-180" : ""}`} />
        </button>
        {skillsOpen && (
          <div className="px-4 py-3 space-y-3 border-t">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1"><Label className="text-xs">Skill Name *</Label><Input value={newSkillName} onChange={e => setNewSkillName(e.target.value)} className="h-8 text-sm" placeholder="e.g. TypeScript" /></div>
              <div className="space-y-1"><Label className="text-xs">Proficiency (1-5)</Label><Input type="number" min={1} max={5} value={newSkillProf} onChange={e => setNewSkillProf(Number(e.target.value))} className="h-8 text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Date</Label><Input type="date" value={newSkillDate} onChange={e => setNewSkillDate(e.target.value)} className="h-8 text-sm" /></div>
            </div>
            <Button size="sm" onClick={handleAddSkill} disabled={addingSkill || !newSkillName.trim()}>
              <Plus className="h-4 w-4 mr-1" /> {addingSkill ? "Adding..." : "Add Skill"}
            </Button>
            {skills.length > 0 && (
              <div className="space-y-2 pt-1">
                {skills.map(skill => (
                  <Card key={skill.id} className="p-0">
                    <CardContent className="py-2 px-3">
                      {editingSkillId === skill.id ? (
                        <div className="flex gap-2 items-center flex-wrap">
                          <Input value={editSkillName} onChange={e => setEditSkillName(e.target.value)} className="h-7 text-sm w-40" />
                          <Input type="number" min={1} max={5} value={editSkillProf} onChange={e => setEditSkillProf(Number(e.target.value))} className="h-7 text-sm w-16" />
                          <Input type="date" value={editSkillDate} onChange={e => setEditSkillDate(e.target.value)} className="h-7 text-sm w-36" />
                          <Button size="sm" className="h-6 text-xs" onClick={() => handleSaveSkill(skill.id)}><Check className="h-3 w-3 mr-1" />Save</Button>
                          <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setEditingSkillId(null)}><X className="h-3 w-3 mr-1" />Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <span className="text-sm font-medium">{skill.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">· {PROF_LABELS[skill.proficiency]} ({skill.proficiency}/5)</span>
                              {skill.date && <span className="text-xs text-muted-foreground ml-2">· {skill.date}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <div key={i} className={`h-2 w-3 rounded-sm ${i < skill.proficiency ? "bg-primary" : "bg-muted"}`} />)}</div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={() => startEditSkill(skill)}><Pencil className="h-3 w-3 text-muted-foreground" /></Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-destructive" onClick={() => handleDeleteSkill(skill.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cards section ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{cards.length} cards · drag to reorder · hover between cards to insert</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImporting(i => !i)}><Upload className="h-4 w-4 mr-1" /> Import</Button>
            <Button size="sm" onClick={() => setAddingCard(a => !a)}><Plus className="h-4 w-4 mr-1" /> Add Card</Button>
          </div>
        </div>

        {importing && <ImportCardsPanel onImport={handleBulkImport} onClose={() => setImporting(false)} />}

        {addingCard && (
          <div className="border border-primary/40 rounded-lg bg-primary/5 p-3 space-y-2">
            <p className="text-xs font-semibold text-primary">New card</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Term *</Label><Textarea value={newTerm} onChange={e => setNewTerm(e.target.value)} rows={4} className="text-sm" /></div>
              <div className="space-y-1"><Label className="text-xs">Definition *</Label><Textarea value={newDef} onChange={e => setNewDef(e.target.value)} rows={4} className="text-sm" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Group</Label>
                <Input list="new-card-groups" value={newGroup} onChange={e => setNewGroup(e.target.value)} className="h-8 text-sm" placeholder="Optional group" />
                <datalist id="new-card-groups">{groups.map(g => <option key={g} value={g} />)}</datalist>
              </div>
              <div className="space-y-1"><Label className="text-xs">Hint</Label><Input value={newHint} onChange={e => setNewHint(e.target.value)} className="h-8 text-sm" placeholder="Optional hint" /></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard} disabled={!newTerm.trim() || !newDef.trim()}><Check className="h-3 w-3 mr-1" /> Add</Button>
              <Button size="sm" variant="outline" onClick={() => setAddingCard(false)}><X className="h-3 w-3 mr-1" /> Cancel</Button>
            </div>
          </div>
        )}

        {cards.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">No cards yet. Add one above.</CardContent></Card>
        ) : (
          <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0">
                {cards.map((card, i) => (
                  <SortableCard
                    key={card.id} card={card} groups={groups}
                    insertOpen={insertingAtIndex === i}
                    onToggleInsert={() => setInsertingAtIndex(insertingAtIndex === i ? null : i)}
                    onInsert={(t, d, g, h) => handleInsertBetween(i, t, d, g, h)}
                    onStar={handleStar} onDelete={handleDelete} onUpdate={handleUpdate}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
