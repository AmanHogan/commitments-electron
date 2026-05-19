import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { NoteGroup, Note } from '@/types/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Markdown } from '@/components/markdown'
import { Plus, Trash2, ArrowLeft, Columns2, Eye, Pencil, Download, Upload, FolderDown, X } from 'lucide-react'

type ViewMode = 'edit' | 'split' | 'preview'
type Preset = 'this-month' | 'last-month' | '3-months' | '6-months' | 'this-year' | 'all' | 'custom'

function getPresetRange(preset: Preset): { from: Date | null; to: Date | null } {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  if (preset === 'all') return { from: null, to: null }
  if (preset === 'this-month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: startOfToday }
  }
  if (preset === 'last-month') {
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0, 23, 59, 59) }
  }
  if (preset === '3-months') {
    return { from: new Date(now.getFullYear(), now.getMonth() - 3, 1), to: startOfToday }
  }
  if (preset === '6-months') {
    return { from: new Date(now.getFullYear(), now.getMonth() - 6, 1), to: startOfToday }
  }
  if (preset === 'this-year') {
    return { from: new Date(now.getFullYear(), 0, 1), to: startOfToday }
  }
  return { from: null, to: null }
}

const PRESETS: { value: Preset; label: string }[] = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: '3-months', label: 'Last 3 Months' },
  { value: '6-months', label: 'Last 6 Months' },
  { value: 'this-year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
]

export default function NoteGroupPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const groupId = Number(id)

  const [group, setGroup] = useState<NoteGroup | null>(null)
  const [noteList, setNoteList] = useState<Note[]>([])
  const [activeNote, setActiveNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<ViewMode>('split')
  const [editingGroupName, setEditingGroupName] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [importing, setImporting] = useState(false)

  // Export modal state
  const [exportOpen, setExportOpen] = useState(false)
  const [preset, setPreset] = useState<Preset>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeNoteRef = useRef<Note | null>(null)
  activeNoteRef.current = activeNote

  // Notes that match the current export filter
  const filteredForExport = useMemo(() => {
    let from: Date | null = null
    let to: Date | null = null
    if (preset === 'custom') {
      from = customFrom ? new Date(customFrom) : null
      to = customTo ? new Date(customTo + 'T23:59:59') : null
    } else {
      const range = getPresetRange(preset)
      from = range.from
      to = range.to
    }
    return noteList.filter(n => {
      const d = new Date(n.createdAt)
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    })
  }, [noteList, preset, customFrom, customTo])

  useEffect(() => {
    window.api.noteGroups.getAll().then(groups => {
      const g = (groups as NoteGroup[]).find(x => x.id === groupId)
      if (g) { setGroup(g); setGroupName(g.name) }
    })
    window.api.notes.listByGroup(groupId).then(d => {
      const list = d as Note[]
      setNoteList(list)
      if (list.length > 0) openNote(list[0])
    })
  }, [groupId])

  function openNote(note: Note) {
    flushSave()
    setActiveNote(note)
    setContent(note.content)
    setTitle(note.title)
  }

  function flushSave() {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    const note = activeNoteRef.current
    if (note) {
      window.api.notes.update(note.id, { title, content })
    }
  }

  const scheduleSave = useCallback((noteId: number, nextTitle: string, nextContent: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const updated = await window.api.notes.update(noteId, { title: nextTitle, content: nextContent }) as Note
      setNoteList(prev => prev.map(n => n.id === updated.id ? updated : n))
    }, 600)
  }, [])

  function handleContentChange(val: string) {
    setContent(val)
    if (activeNote) scheduleSave(activeNote.id, title, val)
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    if (activeNote) scheduleSave(activeNote.id, val, content)
  }

  async function handleTitleBlur() {
    if (!activeNote || title === activeNote.title) return
    const updated = await window.api.notes.update(activeNote.id, { title }) as Note
    setActiveNote(updated)
    setNoteList(prev => prev.map(n => n.id === updated.id ? updated : n))
  }

  async function createNote() {
    const note = await window.api.notes.create(groupId, 'Untitled') as Note
    setNoteList(prev => [note, ...prev])
    openNote(note)
  }

  async function deleteNote(note: Note) {
    await window.api.notes.delete(note.id)
    const next = noteList.filter(n => n.id !== note.id)
    setNoteList(next)
    if (activeNote?.id === note.id) {
      if (next.length > 0) openNote(next[0])
      else { setActiveNote(null); setContent(''); setTitle('') }
    }
  }

  async function handleExportNote() {
    if (!activeNote) return
    await window.api.notes.exportNote(title, content)
  }

  async function handleExportFiltered() {
    if (!group) return
    const toExport = filteredForExport.map(n => ({
      title: n.id === activeNote?.id ? title : n.title,
      content: n.id === activeNote?.id ? content : n.content,
    }))
    const count = await window.api.notes.exportGroup(group.name, toExport)
    if (count > 0) setExportOpen(false)
  }

  async function handleImport() {
    setImporting(true)
    try {
      const imported = await window.api.notes.importFiles(groupId) as Note[]
      if (imported.length > 0) {
        setNoteList(prev => [...imported, ...prev])
        openNote(imported[0])
      }
    } finally {
      setImporting(false)
    }
  }

  async function saveGroupName() {
    if (!group || !groupName.trim()) return
    const updated = await window.api.noteGroups.update(group.id, groupName.trim()) as NoteGroup
    setGroup(updated)
    setEditingGroupName(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { flushSave(); navigate('/notes') }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {editingGroupName ? (
          <input
            autoFocus
            className="text-xl font-bold bg-transparent border-b border-primary outline-none"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            onBlur={saveGroupName}
            onKeyDown={e => { if (e.key === 'Enter') saveGroupName(); if (e.key === 'Escape') setEditingGroupName(false) }}
          />
        ) : (
          <h1
            className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
            onClick={() => setEditingGroupName(true)}
          >
            {group?.name ?? '…'}
          </h1>
        )}
        <span className="text-xs text-muted-foreground">{noteList.length} notes</span>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={handleImport} disabled={importing}>
            <Upload className="h-3.5 w-3.5" />{importing ? 'Importing…' : 'Import'}
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setExportOpen(true)} disabled={noteList.length === 0}>
            <FolderDown className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Note list sidebar */}
        <div className="w-52 shrink-0 flex flex-col gap-2 min-h-0">
          <Button size="sm" className="w-full" onClick={createNote}>
            <Plus className="h-3.5 w-3.5 mr-1" /> New Note
          </Button>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {noteList.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No notes yet.</p>
            ) : noteList.map(n => (
              <div
                key={n.id}
                onClick={() => openNote(n)}
                className={`group flex items-center gap-1 rounded-lg border px-2.5 py-2 cursor-pointer transition-colors
                  ${activeNote?.id === n.id ? 'bg-blue-600/20 border-blue-500/40' : 'bg-card hover:bg-accent/40'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{n.title || 'Untitled'}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {new Date(n.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive text-muted-foreground shrink-0"
                  onClick={e => { e.stopPropagation(); deleteNote(n) }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor pane */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {activeNote ? (
            <>
              {/* Title + mode toggle */}
              <div className="flex items-center gap-3 mb-3 shrink-0">
                <input
                  className="flex-1 text-lg font-semibold bg-transparent outline-none border-b border-transparent focus:border-border transition-colors"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  onBlur={handleTitleBlur}
                  placeholder="Note title"
                />
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Export this note" onClick={handleExportNote}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <div className="w-px bg-border mx-0.5" />
                  {([['edit', Pencil], ['split', Columns2], ['preview', Eye]] as const).map(([m, Icon]) => (
                    <Button
                      key={m}
                      size="sm"
                      variant={mode === m ? 'default' : 'ghost'}
                      className="h-7 w-7 p-0"
                      onClick={() => setMode(m)}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Edit / Split / Preview */}
              <div className="flex-1 min-h-0 flex gap-3">
                {(mode === 'edit' || mode === 'split') && (
                  <textarea
                    className="flex-1 min-h-0 resize-none rounded-lg border bg-card p-4 font-mono text-sm leading-relaxed outline-none focus:ring-1 focus:ring-primary"
                    value={content}
                    onChange={e => handleContentChange(e.target.value)}
                    placeholder="Write markdown here…"
                    spellCheck
                  />
                )}
                {(mode === 'preview' || mode === 'split') && (
                  <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-card p-4">
                    {content.trim() ? (
                      <Markdown>{content}</Markdown>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Nothing to preview yet.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <p className="text-sm">Create a note to get started.</p>
              <Button size="sm" onClick={createNote}><Plus className="h-4 w-4 mr-1" /> New Note</Button>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setExportOpen(false)}>
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Export Notes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choose which notes to export by date created.</p>
              </div>
              <button className="p-1 rounded hover:bg-accent text-muted-foreground" onClick={() => setExportOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Preset buttons */}
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPreset(p.value)}
                  className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors
                    ${preset === p.value ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent/50'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom range inputs */}
            {preset === 'custom' && (
              <div className="flex gap-3 items-center">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            )}

            {/* Match count */}
            <div className={`rounded-lg px-4 py-3 text-sm ${filteredForExport.length > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
              {filteredForExport.length === 0
                ? 'No notes match this range.'
                : `${filteredForExport.length} note${filteredForExport.length === 1 ? '' : 's'} will be exported.`}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setExportOpen(false)}>Cancel</Button>
              <Button size="sm" disabled={filteredForExport.length === 0} onClick={handleExportFiltered}>
                <FolderDown className="h-3.5 w-3.5 mr-1" /> Export {filteredForExport.length > 0 ? `${filteredForExport.length} notes` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
