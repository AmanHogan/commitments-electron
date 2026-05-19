import { useEffect, useState } from 'react'
import DevelopmentCommitmentOnePage from '../components/dcomm1-page'
import type { DevelopmentCommitmentOne } from '@/types/types'

export default function DevelopmentCommitmentsOnePage() {
  const [data, setData] = useState<DevelopmentCommitmentOne[] | null>(null)

  useEffect(() => {
    window.api.dcomm1.getAll().then((d) => setData(d as DevelopmentCommitmentOne[]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Development Commitment</h1>
        <p className="text-sm text-muted-foreground">Track learning items and training modules.</p>
      </div>
      {!data ? <p className="text-muted-foreground text-sm">Loading...</p> : <DevelopmentCommitmentOnePage initialItems={data} />}
    </div>
  )
}
