import { useEffect, useState } from 'react'
import DevelopmentCommitmentTwoPage from '../components/dcomm2-page'
import type { DevelopmentCommitmentTwo } from '@/types/types'
import { JsonTransferBar } from '@/components/json-transfer-bar'
import { sanitizeForDb } from '@/lib/import-sanitize'

export default function DevelopmentCommitmentsTwoPage() {
  const [data, setData] = useState<DevelopmentCommitmentTwo[] | null>(null)
  const [importKey, setImportKey] = useState(0)

  async function reload() {
    const d = await window.api.dcomm2.getAll()
    setData(d as DevelopmentCommitmentTwo[])
  }

  useEffect(() => { reload() }, [])

  async function handleExport() {
    const records = await window.api.dcomm2.getAll()
    const json = JSON.stringify(
      { type: 'dcomm2', version: 1, exportedAt: new Date().toISOString(), records },
      null, 2
    )
    await window.api.data.saveJson('dcomm2-export.json', json)
  }

  async function handleImport(records: unknown[]) {
    for (const rec of records) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = rec as Record<string, unknown>
      await window.api.dcomm2.create(sanitizeForDb(payload))
    }
    await reload()
    setImportKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Innovation Commitment</h1>
        <p className="text-sm text-muted-foreground">Track hackathons, symposiums, and innovation events.</p>
      </div>
      {data && (
        <JsonTransferBar
          label="Innovation Commitment"
          recordCount={data.length}
          dataType="dcomm2"
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
      {!data ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <DevelopmentCommitmentTwoPage key={importKey} initialEvents={data} />
      )}
    </div>
  )
}
