import { useEffect, useState } from 'react'
import DevelopmentCommitmentTwoPage from '../components/dcomm2-page'
import type { DevelopmentCommitmentTwo } from '@/types/types'

export default function DevelopmentCommitmentsTwoPage() {
  const [data, setData] = useState<DevelopmentCommitmentTwo[] | null>(null)

  useEffect(() => {
    window.api.dcomm2.getAll().then((d) => setData(d as DevelopmentCommitmentTwo[]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Innovation Commitment</h1>
        <p className="text-sm text-muted-foreground">Track hackathons, symposiums, and innovation events.</p>
      </div>
      {!data ? <p className="text-muted-foreground text-sm">Loading...</p> : <DevelopmentCommitmentTwoPage initialEvents={data} />}
    </div>
  )
}
