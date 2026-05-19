import { useEffect, useState } from "react"
import type { FlashCardSet } from "@/types/types"
import { FcSetsList } from "@/components/fc-sets-list"

export default function FlashcardsPage() {
  const [data, setData] = useState<FlashCardSet[] | null>(null)

  useEffect(() => {
    window.api.fcSets.getAll().then(d => setData(d as FlashCardSet[]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Flashcard Sets</h1>
        <p className="text-sm text-muted-foreground">Create and study sets. Export to Quizlet-compatible format.</p>
      </div>
      {!data ? <p className="text-muted-foreground text-sm">Loading...</p> : <FcSetsList initialSets={data} />}
    </div>
  )
}
