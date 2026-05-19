import type { OneOnOne } from "@/types/types"

type Section = {
  heading: string
  fields: [keyof OneOnOne, string][]
}

const SECTIONS: Section[] = [
  {
    heading: "Work",
    fields: [
      ["businessPartnerWork", "Business Partner Work"],
      ["workloadConcerns", "Workload Concerns"],
      ["tdpContributions", "TDP Contributions"],
      ["utilizationPercentage", "Utilization %"],
    ],
  },
  {
    heading: "Training & Development",
    fields: [
      ["trainingSkills", "Training Skills"],
      ["pursuingDegrees", "Pursuing Degrees"],
      ["growthHubProgress", "Growth Hub Progress"],
      ["successPathwaysUpdated", "Success Pathways Updated"],
      ["contingencyTrainingPercentage", "Contingency Training %"],
    ],
  },
  {
    heading: "Compliance",
    fields: [
      ["compliancePercentage", "Compliance %"],
      ["ehsTrainingPercentage", "EHS Training %"],
    ],
  },
  {
    heading: "Discussion",
    fields: [
      ["innovationEvents", "Innovation Events"],
      ["accomplishments", "Accomplishments"],
      ["challenges", "Challenges"],
      ["goals", "Goals"],
      ["questions", "Questions"],
      ["receivingSupport", "Receiving Support"],
      ["additionalItems", "Additional Items"],
      ["outOfOfficePlans", "Out of Office Plans"],
    ],
  },
]

function formatValue(val: unknown): string | null {
  if (val == null || val === "" || val === false) return null
  if (val === true) return "Yes"
  return String(val)
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Markdown ────────────────────────────────────────────────────────────────

export function exportToMarkdown(doc: OneOnOne): void {
  const lines: string[] = [`# 1-on-1 — ${doc.documentDate}`, ""]
  for (const section of SECTIONS) {
    const sectionLines: string[] = []
    for (const [field, label] of section.fields) {
      const text = formatValue(doc[field])
      if (text) sectionLines.push(`### ${label}`, "", text, "")
    }
    if (sectionLines.length > 0) {
      lines.push(`## ${section.heading}`, "", ...sectionLines)
    }
  }
  triggerDownload(new Blob([lines.join("\n")], { type: "text/markdown" }), `one-on-one-${doc.documentDate}.md`)
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export async function exportToPdf(doc: OneOnOne): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({ unit: "pt", format: "letter" })
  const margin = 60
  const maxW = pdf.internal.pageSize.getWidth() - margin * 2
  const pageH = pdf.internal.pageSize.getHeight()
  let y = margin

  function ensureSpace(needed: number) {
    if (y + needed > pageH - margin) {
      pdf.addPage()
      y = margin
    }
  }

  pdf.setFontSize(18)
  pdf.setFont("helvetica", "bold")
  pdf.text(`1-on-1 — ${doc.documentDate}`, margin, y)
  y += 32

  for (const section of SECTIONS) {
    const entries: { label: string; text: string }[] = []
    for (const [field, label] of section.fields) {
      const text = formatValue(doc[field])
      if (text) entries.push({ label, text })
    }
    if (entries.length === 0) continue

    ensureSpace(28)
    pdf.setFontSize(13)
    pdf.setFont("helvetica", "bold")
    pdf.text(section.heading, margin, y)
    y += 22

    for (const { label, text } of entries) {
      ensureSpace(26)
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "bold")
      pdf.text(label, margin, y)
      y += 14

      pdf.setFont("helvetica", "normal")
      const lines = pdf.splitTextToSize(text, maxW) as string[]
      ensureSpace(lines.length * 13 + 10)
      pdf.text(lines, margin, y)
      y += lines.length * 13 + 10
    }
    y += 6
  }

  pdf.save(`one-on-one-${doc.documentDate}.pdf`)
}

// ─── Word (.docx) ─────────────────────────────────────────────────────────────

export async function exportToDocx(doc: OneOnOne): Promise<void> {
  const { Document, Paragraph, TextRun, HeadingLevel, Packer } = await import("docx")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [
    new Paragraph({ text: `1-on-1 — ${doc.documentDate}`, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({}),
  ]

  for (const section of SECTIONS) {
    const entries: { label: string; text: string }[] = []
    for (const [field, label] of section.fields) {
      const text = formatValue(doc[field])
      if (text) entries.push({ label, text })
    }
    if (entries.length === 0) continue

    children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_2 }))

    for (const { label, text } of entries) {
      children.push(
        new Paragraph({ text: label, heading: HeadingLevel.HEADING_3 }),
        ...text.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)] })),
        new Paragraph({})
      )
    }
  }

  const docObj = new Document({ sections: [{ children }] })
  const blob = await Packer.toBlob(docObj)
  triggerDownload(blob, `one-on-one-${doc.documentDate}.docx`)
}
