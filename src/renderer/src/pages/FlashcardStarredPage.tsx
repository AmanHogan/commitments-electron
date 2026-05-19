import { useEffect, useState } from "react"
import { FcStarredPage } from "@/components/fc-starred-page"

export default function FlashcardStarredPage() {
  const [groups, setGroups] = useState<any[] | null>(null)

  useEffect(() => {
    window.api.fcCards.getStarredGrouped().then(d => setGroups(d as any[]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Starred Cards</h1>
        <p className="text-sm text-muted-foreground">Cards you've starred while studying, grouped by set.</p>
      </div>
      {!groups ? <p className="text-muted-foreground text-sm">Loading...</p> : <FcStarredPage groups={groups} />}
    </div>
  )
}
