import { useEffect, useState } from 'react'
import type { ResumeFile } from '@/types/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Trash2, Check, X, Pencil, FileText } from 'lucide-react'

export default function ResumePage() {
  const [files, setFiles] = useState<ResumeFile[]>([])
  const [active, setActive] = useState<ResumeFile | null>(null)
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')

  useEffect(() => {
    window.api.resumeFiles.getAll().then(d => {
      const list = d as ResumeFile[]
      setFiles(list)
      if (list.length > 0) activateFile(list[0])
    })
  }, [])

  async function activateFile(rf: ResumeFile) {
    setActive(rf)
    const url = await window.api.files.getFileUrl(rf.filename)
    setActiveUrl(url)
  }

  async function saveFile(sourcePath: string) {
    setUploading(true)
    try {
      const filename = await window.api.files.save(sourcePath)
      const label = sourcePath.split('/').pop()?.replace(/\.[^/.]+$/, '') ?? ''
      const record = await window.api.resumeFiles.create(filename, label) as ResumeFile
      setFiles(prev => [record, ...prev])
      await activateFile(record)
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const path = (file as any).path as string
    if (path && file.type === 'application/pdf') saveFile(path)
  }

  async function handlePickClick() {
    const paths = await window.api.files.openDialog([
      { name: 'PDF', extensions: ['pdf'] }
    ])
    if (paths[0]) saveFile(paths[0])
  }

  async function handleDelete(rf: ResumeFile) {
    await window.api.resumeFiles.delete(rf.id)
    await window.api.files.delete(rf.filename)
    const next = files.filter(f => f.id !== rf.id)
    setFiles(next)
    if (active?.id === rf.id) {
      if (next[0]) await activateFile(next[0])
      else { setActive(null); setActiveUrl(null) }
    }
  }

  async function saveLabel(id: number) {
    const updated = await window.api.resumeFiles.updateLabel(id, editLabel) as ResumeFile
    setFiles(prev => prev.map(f => f.id === id ? updated : f))
    if (active?.id === id) setActive(updated)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resume</h1>
        <p className="text-sm text-muted-foreground">Upload and view resume versions.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar — version list + upload zone */}
        <div className="space-y-3">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={handlePickClick}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 cursor-pointer transition-colors text-center
              ${dragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-accent/30'}`}
          >
            <Upload className={`h-5 w-5 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-xs font-medium">{uploading ? 'Uploading…' : 'Drop PDF or click'}</p>
          </div>

          {files.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No files yet.</p>
          ) : (
            <div className="space-y-1">
              {files.map(rf => (
                <div
                  key={rf.id}
                  className={`group rounded-lg border px-3 py-2 cursor-pointer transition-colors
                    ${active?.id === rf.id ? 'bg-blue-600/20 border-blue-500/40' : 'bg-card hover:bg-accent/40'}`}
                  onClick={() => activateFile(rf)}
                >
                  {editingId === rf.id ? (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Input
                        autoFocus
                        value={editLabel}
                        onChange={e => setEditLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveLabel(rf.id)}
                        className="h-6 text-xs"
                      />
                      <Button size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => saveLabel(rf.id)}><Check className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-xs truncate flex-1">{rf.label || rf.filename}</span>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          className="p-0.5 rounded hover:text-foreground text-muted-foreground"
                          onClick={e => { e.stopPropagation(); setEditingId(rf.id); setEditLabel(rf.label ?? '') }}
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                        <button
                          className="p-0.5 rounded hover:text-destructive text-muted-foreground"
                          onClick={e => { e.stopPropagation(); handleDelete(rf) }}
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 pl-5">
                    {new Date(rf.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PDF viewer */}
        <div className="rounded-lg border bg-card overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
          {active && activeUrl ? (
            // @ts-ignore – webview is an Electron-only element not in React's DOM types
            <webview
              key={activeUrl}
              src={activeUrl}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <FileText className="h-12 w-12 opacity-30" />
              <p className="text-sm">Upload a PDF to view it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
