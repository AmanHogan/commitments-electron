import { useState } from "react"
import { Link } from "react-router-dom"
import type { FlashCardSet } from "@/types/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Trash2, Search, FileText, ChevronDown } from "lucide-react"
import { exportAllSetsToText, exportAllSetsToMarkdownNotes } from "@/lib/utils/fc-export-markdown"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Props {
  initialSets: FlashCardSet[]
}

export function FcSetsList({ initialSets }: Props) {
  const [sets, setSets] = useState(initialSets)
  const [query, setQuery] = useState("")
  const [deleting, setDeleting] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  const filtered = sets.filter(s => {
    const q = query.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      (s.description ?? "").toLowerCase().includes(q) ||
      (s.topic ?? "").toLowerCase().includes(q) ||
      (s.tags ?? []).some(t => t.toLowerCase().includes(q))
    )
  })

  async function handleDelete(id: number) {
    if (!confirm("Delete this set? This cannot be undone.")) return
    setDeleting(id)
    try {
      await window.api.fcSets.delete(id)
      setSets(sets.filter(s => s.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const created = await window.api.fcSets.create({ title: newTitle.trim(), tags: [] }) as FlashCardSet
      setSets([{ ...created, flashCards: [] }, ...sets])
      setNewTitle("")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Search sets..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={sets.length === 0}>
              <Download className="h-4 w-4 mr-1" /> Export All <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Export all sets as</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportAllSetsToText(sets)}>
              <Download className="h-3.5 w-3.5 mr-2 shrink-0" />
              <div><div className="text-sm">Flashcard format</div><div className="text-xs text-muted-foreground">.txt · Quizlet-compatible</div></div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportAllSetsToMarkdownNotes(sets)}>
              <FileText className="h-3.5 w-3.5 mr-2 shrink-0" />
              <div><div className="text-sm">Notes</div><div className="text-xs text-muted-foreground">.md · Separated by ---</div></div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="New set title..."
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCreate()}
          className="max-w-xs"
        />
        <Button onClick={handleCreate} disabled={creating || !newTitle.trim()}>
          {creating ? "Creating..." : "+ New Set"}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {query ? "No sets match your search." : "No sets yet. Create one above."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(set => (
            <Card key={set.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/flashcards/sets/${set.id}`} className="flex-1 min-w-0">
                    <CardTitle className="text-base hover:underline line-clamp-1 cursor-pointer">{set.title}</CardTitle>
                  </Link>
                  <Button
                    variant="ghost" size="sm"
                    className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(set.id)}
                    disabled={deleting === set.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {set.topic && <p className="text-xs text-muted-foreground">{set.topic}</p>}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{set.description ?? "No description"}</p>
                {(set.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {set.tags!.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2">
                  <span>{set.cardCount ?? set.flashCards?.length ?? 0} cards</span>
                  <span>{set.timesStudied} sessions</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
