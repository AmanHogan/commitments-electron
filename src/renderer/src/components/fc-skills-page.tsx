import { useState, useRef, useEffect } from "react"
import type { FcSkill, FlashCardSet } from "@/types/types"
import { exportFcSkillsToMarkdown } from "@/lib/utils/fc-export-markdown"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, GraduationCap, Download, Pencil, Check, X } from "lucide-react"

interface Props {
  initialSkills: FcSkill[]
  sets: FlashCardSet[]
}

const profLabels: Record<number, string> = {
  1: "Beginner", 2: "Basic", 3: "Intermediate", 4: "Advanced", 5: "Expert",
}

export function FcSkillsPage({ initialSkills, sets }: Props) {
  const [skills, setSkills] = useState(initialSkills)
  const [name, setName] = useState("")
  const [proficiency, setProficiency] = useState(3)
  const [date, setDate] = useState("")
  const [flashCardSetId, setFlashCardSetId] = useState<string>("none")
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editProf, setEditProf] = useState(3)
  const [editDate, setEditDate] = useState("")
  const [editSetId, setEditSetId] = useState<string>("none")
  const [filterSet, setFilterSet] = useState<string>("all")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const filtered = filterSet === "all"
    ? skills
    : filterSet === "none"
    ? skills.filter(s => !s.flashCardSetId)
    : skills.filter(s => s.flashCardSetId === Number(filterSet))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const counts = [0, 0, 0, 0, 0]
    for (const s of skills) { if (s.proficiency >= 1 && s.proficiency <= 5) counts[s.proficiency - 1]++ }
    const total = counts.reduce((a, b) => a + b, 0)
    if (total === 0) { ctx.clearRect(0, 0, canvas.width, canvas.height); return }
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"]
    const cx = canvas.width / 2, cy = canvas.height / 2
    const r = Math.min(cx, cy) - 10
    let start = -Math.PI / 2
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    counts.forEach((count, i) => {
      if (count === 0) return
      const slice = (count / total) * 2 * Math.PI
      ctx.beginPath(); ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, start + slice); ctx.closePath()
      ctx.fillStyle = colors[i]; ctx.fill()
      start += slice
    })
  }, [skills])

  async function handleAdd() {
    if (!name.trim()) return
    setAdding(true)
    try {
      const skill = await window.api.fcSkills.create({
        name, proficiency, date: date || undefined,
        flashCardSetId: flashCardSetId !== "none" ? Number(flashCardSetId) : undefined,
      }) as FcSkill
      setSkills([...skills, skill])
      setName(""); setProficiency(3); setDate(""); setFlashCardSetId("none")
    } finally { setAdding(false) }
  }

  function startEdit(skill: FcSkill) {
    setEditingId(skill.id); setEditName(skill.name); setEditProf(skill.proficiency)
    setEditDate(skill.date ?? ""); setEditSetId(skill.flashCardSetId?.toString() ?? "none")
  }

  async function saveEdit(id: number) {
    const updated = await window.api.fcSkills.update(id, {
      name: editName, proficiency: editProf, date: editDate || undefined,
      flashCardSetId: editSetId !== "none" ? Number(editSetId) : undefined,
    }) as FcSkill
    setSkills(ss => ss.map(s => s.id === id ? updated : s))
    setEditingId(null)
  }

  async function handleDelete(id: number) {
    await window.api.fcSkills.delete(id)
    setSkills(ss => ss.filter(s => s.id !== id))
  }

  const byProficiency = [5, 4, 3, 2, 1].map(p => ({
    level: p, label: profLabels[p],
    skills: filtered.filter(s => s.proficiency === p),
  })).filter(g => g.skills.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">{skills.length} skills tracked</p>
        <Button variant="outline" onClick={() => exportFcSkillsToMarkdown(skills)} disabled={skills.length === 0}>
          <Download className="h-4 w-4 mr-1" /> Export
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Add Skill</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Skill Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. React Hooks" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Proficiency (1-5)</Label>
                  <Input type="number" min={1} max={5} value={proficiency} onChange={e => setProficiency(Number(e.target.value))} className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Linked Set</Label>
                  <Select value={flashCardSetId} onValueChange={setFlashCardSetId}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {sets.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" onClick={handleAdd} disabled={adding || !name.trim()}>
                <Plus className="h-4 w-4 mr-1" /> {adding ? "Adding..." : "Add Skill"}
              </Button>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground shrink-0">Filter by set:</Label>
            <Select value={filterSet} onValueChange={setFilterSet}>
              <SelectTrigger className="h-8 text-sm w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sets</SelectItem>
                <SelectItem value="none">No Set</SelectItem>
                {sets.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {byProficiency.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <GraduationCap className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No skills yet.</p>
              </CardContent>
            </Card>
          ) : (
            byProficiency.map(({ level, label, skills: groupSkills }) => (
              <div key={level} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{label} ({level}/5)</Badge>
                  <span className="text-xs text-muted-foreground">{groupSkills.length} skills</span>
                </div>
                {groupSkills.map(skill => (
                  <Card key={skill.id} className="p-0">
                    <CardContent className="py-2 px-3">
                      {editingId === skill.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm" />
                            <Input type="number" min={1} max={5} value={editProf} onChange={e => setEditProf(Number(e.target.value))} className="h-7 text-sm w-16" />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="h-7 text-sm" />
                            <Select value={editSetId} onValueChange={setEditSetId}>
                              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {sets.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.title}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" className="h-6 text-xs" onClick={() => saveEdit(skill.id)}><Check className="h-3 w-3 mr-1" />Save</Button>
                            <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setEditingId(null)}><X className="h-3 w-3 mr-1" />Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div>
                              <span className="text-sm font-medium">{skill.name}</span>
                              {skill.flashCardSetTitle && <span className="text-xs text-muted-foreground ml-2">· {skill.flashCardSetTitle}</span>}
                              {skill.date && <span className="text-xs text-muted-foreground ml-2">· {skill.date}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className={`h-2 w-3 rounded-sm ${i < skill.proficiency ? "bg-primary" : "bg-muted"}`} />
                              ))}
                            </div>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={() => startEdit(skill)}><Pencil className="h-3 w-3 text-muted-foreground" /></Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:text-destructive" onClick={() => handleDelete(skill.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Proficiency Breakdown</CardTitle></CardHeader>
            <CardContent>
              <canvas ref={canvasRef} width={200} height={200} className="mx-auto" />
              <div className="mt-3 space-y-1">
                {[
                  { level: 5, label: "Expert", color: "#3b82f6" },
                  { level: 4, label: "Advanced", color: "#22c55e" },
                  { level: 3, label: "Intermediate", color: "#eab308" },
                  { level: 2, label: "Basic", color: "#f97316" },
                  { level: 1, label: "Beginner", color: "#ef4444" },
                ].map(({ level, label, color }) => {
                  const count = skills.filter(s => s.proficiency === level).length
                  return (
                    <div key={level} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        <span>{label}</span>
                      </div>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
