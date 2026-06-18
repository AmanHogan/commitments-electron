import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { X, Download, Copy, Check } from 'lucide-react'
import type { ViewerDoc } from '@/lib/document-render'
import { docToMarkdown, downloadDocMarkdown } from '@/lib/document-render'
import { Button } from './button'

export function DocumentViewer({
  doc,
  open,
  onClose,
}: {
  doc: ViewerDoc | null
  open: boolean
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!doc) return
    try {
      await navigator.clipboard.writeText(docToMarkdown(doc))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard unavailable */ }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-border bg-card shadow-xl focus:outline-none"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <Dialog.Title className="min-w-0 truncate text-lg font-semibold">{doc?.title ?? 'Document'}</Dialog.Title>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => void handleCopy()} disabled={!doc}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy MD'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => doc && downloadDocMarkdown(doc)} disabled={!doc}>
                <Download className="h-4 w-4" />Export MD
              </Button>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-xs" aria-label="Close"><X className="h-4 w-4" /></Button>
              </Dialog.Close>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5">
            {doc?.subtitle && <p className="text-sm text-muted-foreground">{doc.subtitle}</p>}
            {doc?.blocks.map((b, i) => {
              switch (b.type) {
                case 'heading':
                  return b.level === 2 ? (
                    <h2 key={i} className="mt-2 border-b border-border pb-1 text-base font-bold text-foreground">{b.text}</h2>
                  ) : (
                    <h3 key={i} className="mt-1 text-sm font-semibold text-foreground">{b.text}</h3>
                  )
                case 'field':
                  return (
                    <div key={i} className="text-sm">
                      <span className="font-semibold text-foreground">{b.label}: </span>
                      <span className="whitespace-pre-wrap text-muted-foreground">{b.value}</span>
                    </div>
                  )
                case 'paragraph':
                  return <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{b.text}</p>
                case 'empty':
                  return <p key={i} className="text-sm italic text-muted-foreground/60">{b.text}</p>
                default:
                  return null
              }
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
