import { useEffect, useState } from 'react'
import BusinessCommitmentTwoPage from '../components/bcomm2-page'
import type { BusinessCommitmentTwo } from '@/types/types'
import { JsonTransferBar } from '@/components/json-transfer-bar'
import { sanitizeForDb } from '@/lib/import-sanitize'

export default function BusinessCommitmentsTwoPage() {
  const [data, setData] = useState<BusinessCommitmentTwo[] | null>(null)
  const [importKey, setImportKey] = useState(0)

  async function reload() {
    const d = await window.api.bcomm2.getAll()
    setData(d as BusinessCommitmentTwo[])
  }

  useEffect(() => { reload() }, [])

  async function handleExport() {
    // getAll already includes subEvents
    const records = await window.api.bcomm2.getAll()
    const json = JSON.stringify(
      { type: 'bcomm2', version: 1, exportedAt: new Date().toISOString(), records },
      null, 2
    )
    await window.api.data.saveJson('bcomm2-export.json', json)
  }

  async function handleImport(records: unknown[]) {
    for (const rec of records) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _c, updatedAt: _u, subEvents, ...payload } = rec as Record<string, unknown>
      const created = await window.api.bcomm2.create(sanitizeForDb(payload)) as { id: number }
      if (Array.isArray(subEvents)) {
        for (const se of subEvents) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _sid, eventId: _eid, createdAt: _sc, updatedAt: _su, ...sePayload } = se as Record<string, unknown>
          await window.api.bcomm2.createSubEvent(created.id, sanitizeForDb(sePayload))
        }
      }
    }
    await reload()
    setImportKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">TDP Program Impact</h1>
        <p className="text-sm text-muted-foreground">Log AT&T and TDP program events and leadership activities.</p>
      </div>
      {data && (
        <JsonTransferBar
          label="TDP Program Impact"
          recordCount={data.length}
          dataType="bcomm2"
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
      {!data ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <BusinessCommitmentTwoPage key={importKey} initialEvents={data} />
      )}
    </div>
  )
}
