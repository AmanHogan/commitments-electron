import { useEffect, useState } from 'react'
import OneOnOnePageComp from '../components/one-on-one-page'
import type { OneOnOne } from '@/types/types'
import { JsonTransferBar } from '@/components/json-transfer-bar'
import { sanitizeForDb } from '@/lib/import-sanitize'

export default function OneOnOnePage() {
  const [data, setData] = useState<OneOnOne[] | null>(null)
  const [importKey, setImportKey] = useState(0)

  async function reload() {
    const d = await window.api.oneOnOne.getAll()
    setData(d as OneOnOne[])
  }

  useEffect(() => { reload() }, [])

  async function handleExport() {
    const records = await window.api.oneOnOne.getAll()
    const json = JSON.stringify(
      { type: 'oneOnOne', version: 1, exportedAt: new Date().toISOString(), records },
      null, 2
    )
    await window.api.data.saveJson('one-on-one-export.json', json)
  }

  async function handleImport(records: unknown[]) {
    for (const rec of records) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = rec as Record<string, unknown>
      await window.api.oneOnOne.create(sanitizeForDb(payload))
    }
    await reload()
    setImportKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">1-on-1 Documents</h1>
        <p className="text-sm text-muted-foreground">Create and export structured meeting records with your AD.</p>
      </div>
      {data && (
        <JsonTransferBar
          label="1-on-1 Documents"
          recordCount={data.length}
          dataType="oneOnOne"
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
      {!data ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <OneOnOnePageComp key={importKey} initialDocs={data} />
      )}
    </div>
  )
}
