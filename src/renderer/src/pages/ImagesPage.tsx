import { useEffect, useState, useRef } from 'react'
import type { ImageFile } from '@/types/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Upload, X, Check, Pencil } from 'lucide-react'

export default function ImagesPage() {
  const [images, setImages] = useState<ImageFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<ImageFile | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.imageFiles.getAll().then(d => setImages(d as ImageFile[]))
  }, [])

  async function saveFile(sourcePath: string) {
    setUploading(true)
    try {
      const filename = await window.api.files.save(sourcePath)
      const record = await window.api.imageFiles.create(filename) as ImageFile
      setImages(prev => [record, ...prev])
    } finally {
      setUploading(false)
    }
  }

  async function handlePaths(paths: string[]) {
    for (const p of paths) await saveFile(p)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const paths = Array.from(e.dataTransfer.files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => (f as any).path as string)
      .filter(Boolean)
    if (paths.length) handlePaths(paths)
  }

  async function handlePickClick() {
    const paths = await window.api.files.openDialog([
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }
    ])
    if (paths.length) handlePaths(paths)
  }

  async function handleDelete(img: ImageFile) {
    await window.api.imageFiles.delete(img.id)
    await window.api.files.delete(img.filename)
    setImages(prev => prev.filter(i => i.id !== img.id))
    if (lightbox?.id === img.id) setLightbox(null)
  }

  async function saveLabel(id: number) {
    const updated = await window.api.imageFiles.updateLabel(id, editLabel) as ImageFile
    setImages(prev => prev.map(i => i.id === id ? updated : i))
    if (lightbox?.id === id) setLightbox(updated)
    setEditingId(null)
  }

  function startEdit(img: ImageFile) {
    setEditingId(img.id)
    setEditLabel(img.label ?? '')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Images</h1>
        <p className="text-sm text-muted-foreground">Upload and manage photos and screenshots.</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={handlePickClick}
        className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 cursor-pointer transition-colors
          ${dragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-accent/30'}`}
      >
        <Upload className={`h-8 w-8 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
        <div className="text-center">
          <p className="text-sm font-medium">{uploading ? 'Uploading…' : 'Drop images here or click to select'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, GIF, WebP, SVG supported</p>
        </div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" />
      </div>

      {/* Grid */}
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No images yet. Drop some above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {images.map(img => (
            <div key={img.id} className="group relative rounded-lg border bg-card overflow-hidden">
              <div
                className="aspect-video bg-muted cursor-pointer overflow-hidden"
                onClick={() => setLightbox(img)}
              >
                <img
                  src={`local:///${img.filename}`}
                  alt={img.label ?? img.filename}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-2 space-y-1">
                {editingId === img.id ? (
                  <div className="flex gap-1">
                    <Input
                      autoFocus
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveLabel(img.id)}
                      className="h-6 text-xs"
                      placeholder="Label"
                    />
                    <Button size="sm" className="h-6 w-6 p-0" onClick={() => saveLabel(img.id)}><Check className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs text-muted-foreground truncate flex-1">{img.label || img.filename}</p>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => startEdit(img)}><Pencil className="h-2.5 w-2.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0 hover:text-destructive" onClick={() => handleDelete(img)}><Trash2 className="h-2.5 w-2.5" /></Button>
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground/60">{new Date(img.uploadedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img
              src={`local:///${lightbox.filename}`}
              alt={lightbox.label ?? lightbox.filename}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={() => setLightbox(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {lightbox.label && (
              <p className="mt-2 text-center text-sm text-white/80">{lightbox.label}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
