import { useEffect, useState } from 'react'
import DevelopmentCommitmentOnePage from '../components/dcomm1-page'
import type { DevelopmentCommitmentOne } from '@/types/types'
import { JsonTransferBar } from '@/components/json-transfer-bar'
import { sanitizeForDb } from '@/lib/import-sanitize'

export default function DevelopmentCommitmentsOnePage() {
  const [data, setData] = useState<DevelopmentCommitmentOne[] | null>(null)
  const [importKey, setImportKey] = useState(0)

  async function reload() {
    const d = await window.api.dcomm1.getAll()
    setData(d as DevelopmentCommitmentOne[])
  }

  useEffect(() => { reload() }, [])

  async function handleExport() {
    // getAll returns flat items — fetch modules per item
    const items = await window.api.dcomm1.getAll() as { id: number }[]
    const records = await Promise.all(
      items.map(async (item) => {
        const modules = await window.api.dcomm1.getModules(item.id)
        return { ...item, modules }
      })
    )
    const json = JSON.stringify(
      { type: 'dcomm1', version: 1, exportedAt: new Date().toISOString(), records },
      null, 2
    )
    await window.api.data.saveJson('dcomm1-export.json', json)
  }

  async function handleImport(records: unknown[]) {
    for (const rec of records) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, createdAt: _c, updatedAt: _u, modules, ...payload } = rec as Record<string, unknown>
      const created = await window.api.dcomm1.create(sanitizeForDb(payload)) as { id: number }
      if (Array.isArray(modules)) {
        for (const mod of modules) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _mid, itemId: _iid, createdAt: _mc, updatedAt: _mu, ...modPayload } = mod as Record<string, unknown>
          await window.api.dcomm1.createModule(created.id, sanitizeForDb(modPayload))
        }
      }
    }
    await reload()
    setImportKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Development Commitment</h1>
        <p className="text-sm text-muted-foreground">Track learning items and training modules.</p>
      </div>
      {data && (
        <JsonTransferBar
          label="Development Commitment"
          recordCount={data.length}
          dataType="dcomm1"
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
      {!data ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <DevelopmentCommitmentOnePage key={importKey} initialItems={data} />
      )}
    </div>
  )
}
