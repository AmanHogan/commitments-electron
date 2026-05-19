import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import type { FlashCardSet, FcSkill } from "@/types/types"
import { SetDetailClient } from "@/components/fc-set-detail"

export default function FlashcardSetPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [set, setSet] = useState<FlashCardSet | null>(null)
  const [skills, setSkills] = useState<FcSkill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const numId = Number(id)
    Promise.all([
      window.api.fcSets.get(numId),
      window.api.fcSkills.listBySet(numId),
    ]).then(([s, sk]) => {
      setSet(s as FlashCardSet)
      setSkills(sk as FcSkill[])
    }).catch(() => navigate("/flashcards/sets")).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-muted-foreground text-sm">Loading...</p>
  if (!set) return <p className="text-muted-foreground text-sm">Set not found.</p>
  return <SetDetailClient set={set} skills={skills} />
}
