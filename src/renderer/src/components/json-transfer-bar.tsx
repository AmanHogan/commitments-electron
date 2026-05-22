import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, X, Check } from 'lucide-react'

type Props = {
  /** Human-readable name shown in the inline confirmation */
  label: string
  /** How many records currently exist */
  recordCount: number
  /** Type key embedded in the JSON so we can reject mismatched files on import */
  dataType: string
  /** Parent builds the JSON string and calls window.api.data.saveJson */
  onExport: () => Promise<void>
  /** Parent receives the parsed records array and handles DB operations */
  onImport: (records: unknown[]) => Promise<void>
}

export function JsonTransferBar({ label, recordCount, dataType, onExport, onImport }: Props) {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Pending state: records parsed from file, waiting for user to confirm
  const [pendingRecords, setPendingRecords] = useState<unknown[] | null>(null)

  async function handleExport() {
    setExporting(true)
    setError(null)
    setSuccess(null)
    try {
      await onExport()
      setSuccess(`Exported ${recordCount} ${label} record${recordCount !== 1 ? 's' : ''}.`)
    } catch {
      setError('Export failed.')
    } finally {
      setExporting(false)
    }
  }

  async function handlePickFile() {
    setError(null)
    setSuccess(null)
    setPendingRecords(null)
    const raw = await window.api.data.readJson()
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed.type !== dataType) {
        setError(`Wrong file type. Expected "${dataType}" but got "${parsed.type}".`)
        return
      }
      if (!Array.isArray(parsed.records)) {
        setError('Invalid file — missing records array.')
        return
      }
      setPendingRecords(parsed.records)
    } catch {
      setError('Could not parse the selected file as JSON.')
    }
  }

  async function confirmImport() {
    if (!pendingRecords) return
    setImporting(true)
    setError(null)
    try {
      await onImport(pendingRecords)
      setSuccess(`Added ${pendingRecords.length} record${pendingRecords.length !== 1 ? 's' : ''} to ${label}.`)
      setPendingRecords(null)
    } catch {
      setError('Import failed.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-xs"
        onClick={handleExport}
        disabled={exporting || recordCount === 0}
      >
        <Download className="h-3.5 w-3.5" />
        {exporting ? 'Exporting…' : 'Export JSON'}
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-xs"
        onClick={handlePickFile}
        disabled={importing}
      >
        <Upload className="h-3.5 w-3.5" />
        Import JSON
      </Button>

      {/* Inline confirmation — shown after a valid file is picked */}
      {pendingRecords && (
        <span className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs">
          <span className="text-muted-foreground">
            Add <strong className="text-foreground">{pendingRecords.length}</strong> record{pendingRecords.length !== 1 ? 's' : ''}?
          </span>
          <Button
            size="sm"
            variant="default"
            className="h-5 px-2 text-xs"
            onClick={confirmImport}
            disabled={importing}
          >
            <Check className="h-3 w-3 mr-0.5" />
            {importing ? 'Adding…' : 'Add'}
          </Button>
          <button
            className="rounded p-0.5 hover:bg-accent text-muted-foreground"
            onClick={() => setPendingRecords(null)}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
      {success && !pendingRecords && (
        <p className="flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" />
          {success}
        </p>
      )}
    </div>
  )
}
