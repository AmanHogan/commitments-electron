
import { Card, CardContent } from "./card"
import SectionLabel from "./section-label"
import { Badge } from "./badge"

type DocCompProps = {
  cardTitle?: string
  cardDescription?: string
  goals?: string
  validationCriteria?: string[]
  tips?: string[]
}

const sectionBadgeClasses = {
  goals: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  validation: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  tips: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
}

export default function DocComp({
  cardTitle = "Doc Title",
  cardDescription = "Document Description",
  goals = "Goals and measures go here. Describe what the commitment aims to achieve and how success will be measured.",
  validationCriteria = [],
  tips = [],
}: DocCompProps) {
  return (
    <Card className="shadow-sm">
      <CardContent>
        <SectionLabel size="md">{cardTitle}</SectionLabel>
        <p className="mb-4 text-sm text-muted-foreground">{cardDescription}</p>
        <div className="mb-3 inline-flex items-center gap-2">
          <Badge className={sectionBadgeClasses.goals}>Goals</Badge>
          <Badge className={sectionBadgeClasses.validation}>Validation</Badge>
          <Badge className={sectionBadgeClasses.tips}>Tips</Badge>
        </div>

        <div className="mb-3 items-center gap-2">
          <span className="text-sm font-bold">Goals / Measures (WHAT & HOW)</span>
        </div>
        <p className="mb-4">{goals}</p>

        <div className="mb-3 inline-flex items-center gap-2">
          <span className="text-sm font-bold">Validation / Completion Criteria</span>
        </div>
        {validationCriteria.length > 0 ? (
          <ul className="ml-4 list-disc space-y-2">
            {validationCriteria.map((criteria, index) => (
              <li key={index}>{criteria}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No validation criteria provided.</p>
        )}

        <div className="mt-4 mb-3 inline-flex items-center gap-2">
          <span className="text-sm font-bold">Tips</span>
        </div>
        {tips.length > 0 ? (
          <ul className="ml-4 list-disc space-y-2">
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No tips provided.</p>
        )}
      </CardContent>
    </Card>
  )
}
