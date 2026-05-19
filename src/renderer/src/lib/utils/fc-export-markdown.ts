import type { FlashCard, FlashCardSet, FcSkill } from "@/types/types"

function cardToLine(
  card: Pick<FlashCard, "term" | "definition" | "groupName" | "hint">,
  includeGroup: boolean,
  includeHint: boolean,
): string {
  const parts = [card.term, card.definition]
  if (includeGroup || includeHint) parts.push(card.groupName ?? "")
  if (includeHint) parts.push(card.hint ?? "")
  return parts.join("\t")
}

function setToMarkdown(set: FlashCardSet): string {
  const cards = set.flashCards ?? []
  const lines: string[] = []
  lines.push(`# ${set.title}`)
  if (set.topic) lines.push(`> ${set.topic}`)
  if (set.description) lines.push(`\n${set.description}`)
  if ((set.tags ?? []).length > 0) lines.push(`\n**Tags:** ${set.tags!.join(", ")}`)
  lines.push("")
  const groups = Array.from(new Set(cards.map(c => c.groupName ?? "").filter(Boolean)))
  const ungrouped = cards.filter(c => !c.groupName)
  const grouped = groups.map(g => ({ name: g, cards: cards.filter(c => c.groupName === g) }))
  const renderCards = (subset: FlashCard[]) => {
    for (const card of subset) {
      lines.push(`**${card.term}**`)
      lines.push(`${card.definition}`)
      if (card.hint) lines.push(`*Hint: ${card.hint}*`)
      lines.push("")
    }
  }
  if (ungrouped.length > 0) renderCards(ungrouped)
  for (const { name, cards: gc } of grouped) {
    lines.push(`## ${name}`)
    lines.push("")
    renderCards(gc)
  }
  return lines.join("\n")
}

function trigger(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function slug(text: string): string {
  return text.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "")
}

export function exportSetToText(title: string, cards: FlashCard[]): void {
  const includeGroup = cards.some(c => c.groupName)
  const includeHint = cards.some(c => c.hint)
  const lines = cards.map(c => cardToLine(c, includeGroup, includeHint))
  trigger(lines.join("\n"), `${slug(title)}.txt`, "text/plain")
}

export function exportAllSetsToText(sets: FlashCardSet[]): void {
  const lines: string[] = []
  for (const set of sets) {
    lines.push(`# ${set.title}`)
    const cards = set.flashCards ?? []
    const includeGroup = cards.some(c => c.groupName)
    const includeHint = cards.some(c => c.hint)
    for (const c of cards) lines.push(cardToLine(c, includeGroup, includeHint))
    lines.push("")
  }
  trigger(lines.join("\n"), "all_sets.txt", "text/plain")
}

export function exportSetToMarkdownNotes(set: FlashCardSet): void {
  trigger(setToMarkdown(set), `${slug(set.title)}.md`, "text/markdown")
}

export function exportAllSetsToMarkdownNotes(sets: FlashCardSet[]): void {
  const blocks = sets.map(setToMarkdown)
  trigger(blocks.join("\n\n---\n\n"), "all_sets_notes.md", "text/markdown")
}

export function exportFcSkillsToMarkdown(skills: FcSkill[]): void {
  const byProf: Record<number, FcSkill[]> = {}
  for (const s of skills) {
    if (!byProf[s.proficiency]) byProf[s.proficiency] = []
    byProf[s.proficiency].push(s)
  }
  const lines: string[] = ["# Skills Export\n"]
  for (let p = 5; p >= 1; p--) {
    const group = byProf[p]
    if (!group || group.length === 0) continue
    lines.push(`## Proficiency ${p}/5\n`)
    for (const s of group) lines.push(`- **${s.name}**${s.date ? ` (${s.date})` : ""}`)
    lines.push("")
  }
  trigger(lines.join("\n"), "fc-skills.md", "text/markdown")
}
