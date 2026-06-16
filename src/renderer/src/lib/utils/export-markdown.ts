import type {
  BusinessCommitmentOne,
  BusinessCommitmentTwo,
  DevelopmentCommitmentOne,
  DevelopmentCommitmentTwo,
  ActionItem,
  Skill,
} from "@/types/types"
import { getModulesForItem, getDcomm2SubEvents } from "@/lib/actions"

function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function stamp(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function row(label: string, value: string | number | boolean | null | undefined): string {
  if (value == null || value === "" || value === false) return ""
  const display = value === true ? "Yes" : String(value)
  return `- **${label}:** ${display}\n`
}

function slug(value: string | undefined): string {
  return (value ?? "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "untitled"
}

// ─── Business Commitments 1 ──────────────────────────────────────────────────

// Renders every field of a single business commitment (shared by the bulk and
// the one-by-one exports so they always stay in sync).
function bcomm1Fields(c: BusinessCommitmentOne): string {
  const lines: string[] = []
  lines.push(row("Application Context", c.applicationContext))
  lines.push(row("Date Started", c.started))
  lines.push(row("Date Completed", c.dateCompleted))
  lines.push(row("Description", c.description))
  lines.push(row("Problem / Opportunity", c.problemOpportunity))
  lines.push(row("Who Benefited", c.whoBenefited))
  lines.push(row("Impact", c.impact))
  lines.push(row("Alignment", c.alignment))
  lines.push(row("Status Notes", c.statusNotes))

  if (c.valueCategories && c.valueCategories.length > 0) {
    lines.push(row("Value Categories", c.valueCategories.join(", ")))
  }

  const valueEntries: { label: string; value: string | undefined }[] = [
    { label: "Improved outcomes", value: c.improvedOutcomes ? c.improvedOutcomesText : undefined },
    { label: "Increased efficiency", value: c.increasedEfficiency ? c.increasedEfficiencyText : undefined },
    { label: "Reduced risk/cost", value: c.reducedRiskCost ? c.reducedRiskCostText : undefined },
    {
      label: "Enhanced customer experience",
      value: c.enhancedCustomerExperience ? c.enhancedCustomerExperienceText : undefined,
    },
    {
      label: "Enhanced employee experience",
      value: c.enhancedEmployeeExperience ? c.enhancedEmployeeExperienceText : undefined,
    },
  ].filter((e) => e.value)
  if (valueEntries.length > 0) {
    lines.push("- **Value Entries:**\n")
    valueEntries.forEach((ve) => lines.push(`  - ${ve.label}: ${ve.value}\n`))
  }
  return lines.join("")
}

export function exportBcomm1ToMarkdown(commitments: BusinessCommitmentOne[]): void {
  const lines: string[] = [`# Business Commitments\n\nGenerated: ${stamp()}\n\n---\n`]

  commitments.forEach((c, i) => {
    lines.push(`## ${i + 1}. ${c.workItem ?? "(untitled)"}\n`)
    lines.push(bcomm1Fields(c))
    lines.push("\n---\n")
  })

  downloadMarkdown(lines.join(""), "business-commitments.md")
}

// Export a single business commitment to its own markdown file.
export function exportSingleBcomm1ToMarkdown(c: BusinessCommitmentOne): void {
  const lines: string[] = [`# ${c.workItem ?? "(untitled)"}\n\nGenerated: ${stamp()}\n\n---\n`]
  lines.push(bcomm1Fields(c))
  lines.push("\n")
  downloadMarkdown(lines.join(""), `business-commitment-${slug(c.workItem)}.md`)
}

// ─── Business Commitments 2 ──────────────────────────────────────────────────

export function exportBcomm2ToMarkdown(events: BusinessCommitmentTwo[]): void {
  const lines: string[] = [`# Business Commitments 2\n\nGenerated: ${stamp()}\n\n---\n`]

  events.forEach((ev, i) => {
    lines.push(`## ${i + 1}. ${ev.eventName ?? "(untitled)"}\n`)
    lines.push(row("Type", ev.type))
    lines.push(row("Description", ev.description))
    lines.push(row("Date Started", ev.started))
    lines.push(row("Date Finished", ev.finished))
    lines.push(row("Done", ev.done))
    lines.push(row("Required", ev.required))
    lines.push("\n---\n")
  })

  downloadMarkdown(lines.join(""), "business-commitments-2.md")
}

// ─── Development Commitments 1 ───────────────────────────────────────────────

export async function exportDcomm1ToMarkdown(items: DevelopmentCommitmentOne[]): Promise<void> {
  const lines: string[] = [`# Dev Commitments 1 — Learning Items\n\nGenerated: ${stamp()}\n\n---\n`]

  // Fetch every item's modules fresh so the export always contains all nested
  // data, regardless of what the UI has lazily loaded into state.
  const moduleLists = await Promise.all(
    items.map((item) => (item.id != null ? getModulesForItem(item.id) : Promise.resolve([])))
  )

  items.forEach((item, i) => {
    lines.push(`## ${i + 1}. ${item.itemName ?? "(untitled)"}\n`)
    lines.push(row("Item Date", item.itemDate))

    const modules = moduleLists[i]
    if (modules && modules.length > 0) {
      lines.push("### Modules\n")
      modules.forEach((m, j) => {
        lines.push(`#### ${j + 1}. ${m.moduleName ?? "(untitled)"}\n`)
        lines.push(row("Type", m.type))
        lines.push(row("Hours", m.hours))
        lines.push(row("Date Started", m.dateStarted))
        lines.push(row("Date Finished", m.dateFinished))
        lines.push(row("Finished", m.finished))
        lines.push(row("Required", m.required))
        lines.push(row("Description", m.description))
        lines.push("\n")
      })
    }
    lines.push("\n---\n")
  })

  downloadMarkdown(lines.join(""), "dev-commitments-1.md")
}

// ─── Development Commitments 2 ───────────────────────────────────────────────

export async function exportDcomm2ToMarkdown(events: DevelopmentCommitmentTwo[]): Promise<void> {
  const lines: string[] = [`# Dev Commitments 2 — Innovation Events\n\nGenerated: ${stamp()}\n\n---\n`]

  // Fetch every event's sub-events fresh so all nested items are included.
  const subEventLists = await Promise.all(
    events.map((ev) => (ev.id != null ? getDcomm2SubEvents(ev.id) : Promise.resolve([])))
  )

  events.forEach((ev, i) => {
    lines.push(`## ${i + 1}. ${ev.eventName ?? "(untitled)"}\n`)
    lines.push(row("Type", ev.type))
    lines.push(row("Description", ev.description))
    lines.push(row("Date Started", ev.started))
    lines.push(row("Date Finished", ev.finished))
    lines.push(row("Done", ev.done))
    lines.push(row("Required", ev.required))

    const subEvents = subEventLists[i]
    if (subEvents && subEvents.length > 0) {
      lines.push("\n### Sub-items\n")
      subEvents.forEach((s, j) => {
        lines.push(`#### ${j + 1}. ${s.subEventName ?? "(untitled)"}\n`)
        lines.push(row("Description", s.description))
        lines.push(row("Date Started", s.started))
        lines.push(row("Date Finished", s.finished))
        lines.push(row("Done", s.done))
        lines.push("\n")
      })
    }
    lines.push("\n---\n")
  })

  downloadMarkdown(lines.join(""), "dev-commitments-2.md")
}

// ─── Action Items ─────────────────────────────────────────────────────────────

export function exportActionItemsToMarkdown(items: ActionItem[]): void {
  const lines: string[] = [`# Action Items\n\nGenerated: ${stamp()}\n\n---\n`]

  items.forEach((item, i) => {
    lines.push(`## ${i + 1}. ${item.name ?? "(untitled)"}\n`)
    lines.push(row("Description", item.description))
    lines.push(row("Criticality", item.criticality))
    lines.push(row("Completed", item.completed))
    lines.push(row("Date Started", item.dateStarted))
    lines.push(row("Date Finished", item.dateFinished))
    lines.push("\n---\n")
  })

  downloadMarkdown(lines.join(""), "action-items.md")
}

// ─── Skills ──────────────────────────────────────────────────────────────────

const PROFICIENCY_LABEL: Record<number, string> = {
  1: "Beginner",
  2: "Basic",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
}

export function exportSkillsToMarkdown(skills: Skill[]): void {
  const lines: string[] = [`# Skills\n\nGenerated: ${stamp()}\n`]

  const groups = [5, 4, 3, 2, 1]
    .map((level) => ({
      level,
      items: skills.filter((s) => s.proficiency === level),
    }))
    .filter(({ items }) => items.length > 0)

  for (const { level, items } of groups) {
    lines.push(`\n## ${level} — ${PROFICIENCY_LABEL[level]}\n`)
    lines.push(items.map((s) => `- ${s.name}${s.date ? ` (${s.date})` : ""}`).join("\n"))
    lines.push("")
  }

  downloadMarkdown(lines.join("\n"), "skills.md")
}
