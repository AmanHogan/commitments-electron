import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NoteGroup } from '@/types/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, FileText, ChevronRight } from 'lucide-react'

export default function NotesPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState<NoteGroup[]>([])
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    window.api.noteGroups.getAll().then(d => setGroups(d as NoteGroup[]))
  }, [])

  async function handleCreate() {
    const name = newName.trim()
    if (!name) return
    const g = await window.api.noteGroups.create(name) as NoteGroup
    setGroups(prev => [{ ...g, noteCount: 0 }, ...prev])
    setNewName('')
    setCreating(false)
    navigate(`/notes/${g.id}`)
  }

  async function handleDelete(g: NoteGroup, e: React.MouseEvent) {
    e.stopPropagation()
    await window.api.noteGroups.delete(g.id)
    setGroups(prev => prev.filter(x => x.id !== g.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground">Grouped markdown notes with live preview.</p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Group
        </Button>
      </div>

      {creating && (
        <div className="flex gap-2 max-w-sm">
          <Input
            autoFocus
            placeholder="Group name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false) }}
          />
          <Button size="sm" onClick={handleCreate}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
        </div>
      )}

      {groups.length === 0 && !creating ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <FileText className="h-12 w-12 opacity-30" />
          <p className="text-sm">No note groups yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {groups.map(g => (
            <div
              key={g.id}
              onClick={() => navigate(`/notes/${g.id}`)}
              className="group relative rounded-xl border bg-card p-5 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {g.noteCount} {g.noteCount === 1 ? 'note' : 'notes'}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    className="p-1 rounded hover:text-destructive text-muted-foreground"
                    onClick={e => handleDelete(g, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-3">
                {new Date(g.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
