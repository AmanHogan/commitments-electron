import { useEffect, useState } from 'react'
import BusinessCommitmentTwoPage from '../components/bcomm2-page'
import type { BusinessCommitmentTwo } from '@/types/types'

export default function BusinessCommitmentsTwoPage() {
  const [data, setData] = useState<BusinessCommitmentTwo[] | null>(null)

  useEffect(() => {
    window.api.bcomm2.getAll().then((d) => setData(d as BusinessCommitmentTwo[]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">TDP Program Impact</h1>
        <p className="text-sm text-muted-foreground">Log AT&T and TDP program events and leadership activities.</p>
      </div>
      {!data ? <p className="text-muted-foreground text-sm">Loading...</p> : <BusinessCommitmentTwoPage initialEvents={data} />}
    </div>
  )
}
