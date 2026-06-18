import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppSidebar } from './components/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from './components/ui/sidebar'
import { Separator } from './components/ui/separator'
import DashboardPage from './pages/DashboardPage'
import BusinessCommitmentsPage from './pages/BusinessCommitmentsPage'
import BusinessCommitmentsTwoPage from './pages/BusinessCommitmentsTwoPage'
import DevelopmentCommitmentsOnePage from './pages/DevelopmentCommitmentsOnePage'
import DevelopmentCommitmentsTwoPage from './pages/DevelopmentCommitmentsTwoPage'
import OneOnOnePage from './pages/OneOnOnePage'
import ActionItemsPage from './pages/ActionItemsPage'
import SkillsPage from './pages/SkillsPage'
import TdpDocsPage from './pages/TdpDocsPage'
import ImagesPage from './pages/ImagesPage'
import ResumePage from './pages/ResumePage'
import FlashcardsPage from './pages/FlashcardsPage'
import FlashcardSetPage from './pages/FlashcardSetPage'
import FlashcardStarredPage from './pages/FlashcardStarredPage'
import FlashcardSkillsPage from './pages/FlashcardSkillsPage'
import NotesPage from './pages/NotesPage'
import NoteGroupPage from './pages/NoteGroupPage'
import ProgressionsPage from './pages/ProgressionsPage'
import ReminderToast from './components/ReminderToast'
import StartupBriefing from './components/StartupBriefing'

function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Trigger the first timed-reminder check once the renderer is fully mounted.
    // StartupBriefing calls rendererReady() which also starts the briefing;
    // this ensures the reminder poll also runs immediately on both Mac and Windows.
    window.api.notifications.checkNow().catch(() => {})
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium text-muted-foreground">Commitment Tracker</span>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </SidebarInset>
      <StartupBriefing />
      <ReminderToast />
    </SidebarProvider>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/business-commitments" element={<BusinessCommitmentsPage />} />
          <Route path="/dashboard/business-commitments-two" element={<BusinessCommitmentsTwoPage />} />
          <Route path="/dashboard/development-commitments-one" element={<DevelopmentCommitmentsOnePage />} />
          <Route path="/dashboard/development-commitments-two" element={<DevelopmentCommitmentsTwoPage />} />
          <Route path="/dashboard/one-on-one" element={<OneOnOnePage />} />
          <Route path="/dashboard/action-items" element={<ActionItemsPage />} />
          <Route path="/dashboard/skills" element={<SkillsPage />} />
          <Route path="/dashboard/images" element={<ImagesPage />} />
          <Route path="/dashboard/resume" element={<ResumePage />} />
          <Route path="/flashcards/sets" element={<FlashcardsPage />} />
          <Route path="/flashcards/sets/:id" element={<FlashcardSetPage />} />
          <Route path="/flashcards/starred" element={<FlashcardStarredPage />} />
          <Route path="/flashcards/skills" element={<FlashcardSkillsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/notes/:id" element={<NoteGroupPage />} />
          <Route path="/dashboard/progressions" element={<ProgressionsPage />} />
          <Route path="/docs/tdp" element={<TdpDocsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}
