import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, X, AlertTriangle } from 'lucide-react'

type Props = {
  /** Human-readable name shown in the confirmation modal */
  label: string
  /** How many records currently exist (for the "replace N records" warning) */
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

  // Confirmation modal state
  const [pendingRecords, setPendingRecords] = useState<unknown[] | null>(null)

  async function handleExport() {
    setExporting(true)
    setError(null)
    try {
      await onExport()
    } catch (e) {
      setError('Export failed.')
    } finally {
      setExporting(false)
    }
  }

  async function handlePickFile() {
    setError(null)
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
      setPendingRecords(null)
    } catch {
      setError('Import failed.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={handleExport} disabled={exporting || recordCount === 0}>
          <Download className="h-3.5 w-3.5" />
          {exporting ? 'Exporting…' : 'Export JSON'}
        </Button>
        <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={handlePickFile} disabled={importing}>
          <Upload className="h-3.5 w-3.5" />
          Import JSON
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      {/* Confirmation modal */}
      {pendingRecords && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setPendingRecords(null)}
        >
          <div
            className="bg-card border rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold">Replace {label}?</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will <strong>delete all {recordCount} existing</strong> {label} records and replace them with{' '}
                    <strong>{pendingRecords.length} records</strong> from the file. This cannot be undone.
                  </p>
                </div>
              </div>
              <button className="p-1 rounded hover:bg-accent text-muted-foreground shrink-0" onClick={() => setPendingRecords(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPendingRecords(null)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={confirmImport} disabled={importing}>
                {importing ? 'Importing…' : `Replace ${recordCount > 0 ? `${recordCount} records` : 'all'}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
