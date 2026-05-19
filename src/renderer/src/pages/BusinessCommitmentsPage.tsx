import { useEffect, useState } from 'react'
import BusinessCommitmentsComp from '../components/bcomm-page'
import type { BusinessCommitmentOne } from '@/types/types'

export default function BusinessCommitmentsPage() {
  const [data, setData] = useState<BusinessCommitmentOne[] | null>(null)

  useEffect(() => {
    window.api.bcomm1.getAll().then((d) => setData(d as BusinessCommitmentOne[]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Partner Impact</h1>
        <p className="text-sm text-muted-foreground">Track work items and business value delivered through your BP assignment.</p>
      </div>
      {!data ? <p className="text-muted-foreground text-sm">Loading...</p> : <BusinessCommitmentsComp initialCommitments={data} />}
    </div>
  )
}
