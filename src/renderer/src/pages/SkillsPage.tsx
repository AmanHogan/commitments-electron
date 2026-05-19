import { useEffect, useState } from 'react'
import SkillsPageComp from '../components/skills-page'
import type { Skill } from '@/types/types'

export default function SkillsPage() {
  const [data, setData] = useState<Skill[] | null>(null)

  useEffect(() => {
    window.api.skills.getAll().then((d) => setData(d as Skill[]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
        <p className="text-sm text-muted-foreground">Log and organize your skills by proficiency level.</p>
      </div>
      {!data ? <p className="text-muted-foreground text-sm">Loading...</p> : <SkillsPageComp initialSkills={data} />}
    </div>
  )
}
