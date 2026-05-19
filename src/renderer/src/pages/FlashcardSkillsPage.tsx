import { useEffect, useState } from "react"
import type { FcSkill, FlashCardSet } from "@/types/types"
import { FcSkillsPage } from "@/components/fc-skills-page"

export default function FlashcardSkillsPage() {
  const [skills, setSkills] = useState<FcSkill[] | null>(null)
  const [sets, setSets] = useState<FlashCardSet[]>([])

  useEffect(() => {
    Promise.all([
      window.api.fcSkills.list(),
      window.api.fcSets.getAll(),
    ]).then(([sk, s]) => {
      setSkills(sk as FcSkill[])
      setSets(s as FlashCardSet[])
    })
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Flashcard Skills</h1>
        <p className="text-sm text-muted-foreground">Track skill proficiency linked to your flashcard sets.</p>
      </div>
      {!skills ? <p className="text-muted-foreground text-sm">Loading...</p> : <FcSkillsPage initialSkills={skills} sets={sets} />}
    </div>
  )
}
