import { useEffect, useState } from 'react'
import OneOnOnePageComp from '../components/one-on-one-page'
import type { OneOnOne } from '@/types/types'

export default function OneOnOnePage() {
  const [data, setData] = useState<OneOnOne[] | null>(null)

  useEffect(() => {
    window.api.oneOnOne.getAll().then((d) => setData(d as OneOnOne[]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">1-on-1 Documents</h1>
        <p className="text-sm text-muted-foreground">Create and export structured meeting records with your AD.</p>
      </div>
      {!data ? <p className="text-muted-foreground text-sm">Loading...</p> : <OneOnOnePageComp initialDocs={data} />}
    </div>
  )
}
