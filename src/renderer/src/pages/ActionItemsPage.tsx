import { useEffect, useState } from 'react'
import ActionItemsPageComp from '../components/action-items-page'
import type { ActionItem } from '@/types/types'

export default function ActionItemsPage() {
  const [data, setData] = useState<ActionItem[] | null>(null)

  useEffect(() => {
    window.api.actionItems.getAll().then((d) => setData(d as ActionItem[]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Action Items</h1>
        <p className="text-sm text-muted-foreground">Track tasks and follow-ups with priority levels.</p>
      </div>
      {!data ? <p className="text-muted-foreground text-sm">Loading...</p> : <ActionItemsPageComp initialItems={data} />}
    </div>
  )
}
