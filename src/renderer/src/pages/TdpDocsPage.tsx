import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function TdpDocsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">TDP Docs</h1>
        <p className="text-muted-foreground">Reference documentation for the AT&T Technical Development Program.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Documentation not yet migrated</CardTitle>
              <CardDescription>This section held TDP reference docs in the original web app.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The TDP Docs section in the original Next.js app contained static reference pages for the AT&T TDP program
            — things like commitment definitions, validation criteria, and program timelines.
          </p>
          <p>
            To add content here, create a new page component at{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
              src/renderer/src/pages/TdpDocsPage.tsx
            </code>{' '}
            and add whatever reference text you need.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
