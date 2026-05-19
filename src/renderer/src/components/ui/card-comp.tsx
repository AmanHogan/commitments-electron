"use client"

import { Card, CardHeader, CardContent } from "./card"
import SectionLabel from "./section-label"
import { Button } from "./button"

type CardCompProps = {
  title: string
  description?: string
  children?: React.ReactNode
  onCancel?: () => void
  onSave?: () => void
  onExportToPdf?: () => void
  onExportToMarkdown?: () => void
  onExportToWord?: () => void
  onExportToExcel?: () => void
}

export default function CardComp({
  title,
  description,
  children,
  onCancel,
  onSave,
  onExportToPdf,
  onExportToMarkdown,
  onExportToWord,
  onExportToExcel,
}: CardCompProps) {
  const hasActions = !!(onCancel || onSave || onExportToPdf || onExportToMarkdown || onExportToWord || onExportToExcel)

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <SectionLabel size="md">{title}</SectionLabel>
        {hasActions && (
          <div className="flex flex-wrap items-center gap-2">
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {onExportToPdf && (
              <Button variant="outline" size="sm" onClick={onExportToPdf}>
                Export PDF
              </Button>
            )}
            {onExportToMarkdown && (
              <Button variant="outline" size="sm" onClick={onExportToMarkdown}>
                Export Markdown
              </Button>
            )}
            {onExportToWord && (
              <Button variant="outline" size="sm" onClick={onExportToWord}>
                Export Word
              </Button>
            )}
            {onExportToExcel && (
              <Button variant="outline" size="sm" onClick={onExportToExcel}>
                Export Excel
              </Button>
            )}
            {onSave && (
              <Button size="sm" onClick={onSave}>
                Save
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="mb-4">{description}</p>
        {children}
      </CardContent>
    </Card>
  )
}
