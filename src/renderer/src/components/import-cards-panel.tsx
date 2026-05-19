
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Check, AlertCircle } from "lucide-react"

// ── Parser ────────────────────────────────────────────────────────────────────

export interface ParsedCard {
  term: string
  definition: string
  groupName?: string
  hint?: string
}

type Fmt = "tab" | "csv" | "unknown"

/** Parse a CSV line respecting double-quoted fields. */
function splitCSV(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (ch === ',' && !inQ) {
      out.push(cur.trim()); cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur.trim())
  return out
}

function detectFmt(text: string): Fmt {
  const first = text.trim().split("\n")[0] ?? ""
  if (first.includes("\t")) return "tab"
  if (first.includes(",")) return "csv"
  return "unknown"
}

export function parseImportText(text: string): {
  cards: ParsedCard[]
  fmt: Fmt
  skipped: number
} {
  const fmt = detectFmt(text)
  const lines = text.trim().split("\n")
  const cards: ParsedCard[] = []
  let skipped = 0

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    let parts: string[]
    if (fmt === "tab") {
      parts = line.split("\t").map(p => p.trim())
    } else if (fmt === "csv") {
      parts = splitCSV(line)
    } else {
      // Best-effort: try tab then comma
      const t = line.split("\t")
      parts = t.length >= 2 ? t.map(p => p.trim()) : splitCSV(line)
    }

    const [term, definition, groupName, hint] = parts
    if (!term || !definition) { skipped++; continue }

    cards.push({
      term,
      definition,
      groupName: groupName || undefined,
      hint: hint || undefined,
    })
  }

  return { cards, fmt, skipped }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  /** Existing group names for the datalist (informational only — not used in this panel) */
  groups?: string[]
  onImport: (cards: ParsedCard[]) => Promise<void>
  onClose: () => void
}

export function ImportCardsPanel({ onImport, onClose }: Props) {
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { cards, fmt, skipped } = parseImportText(text)
  const hasContent = text.trim().length > 0
  const hasCards = cards.length > 0
  const showGroup = cards.some(c => c.groupName)
  const showHint = cards.some(c => c.hint)

  const fmtLabel =
    fmt === "tab" ? "Tab-delimited · Quizlet compatible" :
    fmt === "csv" ? "CSV" :
    hasContent ? "Unknown — check format" : ""

  async function handleImport() {
    if (!hasCards) return
    setLoading(true)
    try {
      await onImport(cards)
    } finally {
      setLoading(false)
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setText((ev.target?.result as string) ?? "")
    reader.readAsText(file)
    // reset so the same file can be re-selected
    e.target.value = ""
  }

  return (
    <div className="border border-primary/40 rounded-lg bg-primary/5 p-4 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Import Cards</p>
          <p className="text-xs text-muted-foreground">
            Paste or upload a <strong>.txt</strong> / <strong>.csv</strong> file.
            Columns (tab or comma separated):
          </p>
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded block mt-1 w-fit">
            term · definition · group (optional) · hint (optional)
          </code>
          <p className="text-xs text-muted-foreground pt-1">
            Quizlet exports are tab-delimited — paste them directly.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Input row */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Paste content</Label>
          <div className="flex items-center gap-2">
            {fmtLabel && (
              <Badge
                variant={fmt === "unknown" && hasContent ? "destructive" : "secondary"}
                className="text-xs"
              >
                {fmtLabel}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-3 w-3" /> Upload file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.csv,.tsv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>

        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={
            "Paste tab-delimited (Quizlet) or CSV content. Examples:\n\n" +
            "Mitosis\tCell division producing identical daughter cells\n" +
            "Meiosis\tDivision producing gametes\tReproduction\tHalves chromosome count\n\n" +
            "Or CSV:\n" +
            "Mitosis,Cell division producing identical daughter cells\n" +
            "Meiosis,Division producing gametes,Reproduction"
          }
          rows={7}
          className="text-sm font-mono resize-y"
        />
      </div>

      {/* Preview table */}
      {hasCards && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-semibold">
              {cards.length} card{cards.length !== 1 ? "s" : ""} ready
            </p>
            {skipped > 0 && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                {skipped} line{skipped !== 1 ? "s" : ""} skipped (missing term or definition)
              </Badge>
            )}
            {showGroup && (
              <Badge variant="outline" className="text-xs">groups detected</Badge>
            )}
            {showHint && (
              <Badge variant="outline" className="text-xs">hints detected</Badge>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto rounded border bg-background">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th className="text-left px-2 py-1.5 font-medium">Term</th>
                  <th className="text-left px-2 py-1.5 font-medium">Definition</th>
                  {showGroup && <th className="text-left px-2 py-1.5 font-medium">Group</th>}
                  {showHint && <th className="text-left px-2 py-1.5 font-medium">Hint</th>}
                </tr>
              </thead>
              <tbody>
                {cards.slice(0, 30).map((card, i) => (
                  <tr key={i} className="border-t odd:bg-muted/20">
                    <td className="px-2 py-1.5 max-w-[200px] truncate">{card.term}</td>
                    <td className="px-2 py-1.5 max-w-[200px] truncate text-muted-foreground">
                      {card.definition}
                    </td>
                    {showGroup && (
                      <td className="px-2 py-1.5 text-muted-foreground">{card.groupName ?? "—"}</td>
                    )}
                    {showHint && (
                      <td className="px-2 py-1.5 text-muted-foreground">{card.hint ?? "—"}</td>
                    )}
                  </tr>
                ))}
                {cards.length > 30 && (
                  <tr className="border-t">
                    <td
                      colSpan={2 + (showGroup ? 1 : 0) + (showHint ? 1 : 0)}
                      className="px-2 py-1.5 text-center text-muted-foreground italic"
                    >
                      … and {cards.length - 30} more
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={handleImport}
          disabled={!hasCards || loading}
          size="sm"
        >
          <Check className="h-3 w-3 mr-1" />
          {loading
            ? "Importing…"
            : hasCards
              ? `Import ${cards.length} card${cards.length !== 1 ? "s" : ""}`
              : "Import"}
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        {hasContent && !hasCards && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Could not parse — check that each line has at least a term and definition
          </p>
        )}
      </div>
    </div>
  )
}
