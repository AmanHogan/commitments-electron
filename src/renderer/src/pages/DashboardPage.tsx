import { Link } from 'react-router-dom'
import {
  ClipboardList, Briefcase, BookOpen, Lightbulb,
  Users, CheckSquare, Sparkles, FileText, ImageIcon,
  Layers, Star, GraduationCap, NotebookPen,
} from 'lucide-react'

const sections = [
  {
    group: 'Business',
    items: [
      {
        label: 'Business Partner Impact',
        description: 'Track and document business partner work items and their impact.',
        href: '/dashboard/business-commitments',
        icon: ClipboardList,
        color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
        border: 'hover:border-blue-300 dark:hover:border-blue-700',
      },
      {
        label: 'TDP Program Impact',
        description: 'Log TDP program impact commitment events and leadership activities.',
        href: '/dashboard/business-commitments-two',
        icon: Briefcase,
        color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
        border: 'hover:border-indigo-300 dark:hover:border-indigo-700',
      },
    ],
  },
  {
    group: 'Development',
    items: [
      {
        label: 'Development Commitment',
        description: 'Manage learning items and training modules.',
        href: '/dashboard/development-commitments-one',
        icon: BookOpen,
        color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
        border: 'hover:border-emerald-300 dark:hover:border-emerald-700',
      },
      {
        label: 'Innovation Commitment',
        description: 'Track hackathons, symposiums, and innovation events.',
        href: '/dashboard/development-commitments-two',
        icon: Lightbulb,
        color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
        border: 'hover:border-amber-300 dark:hover:border-amber-700',
      },
      {
        label: 'Skills',
        description: 'Log and organize your skills by proficiency level.',
        href: '/dashboard/skills',
        icon: Sparkles,
        color: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
        border: 'hover:border-teal-300 dark:hover:border-teal-700',
      },
      {
        label: 'Resume',
        description: 'Upload and view resume versions with the built-in PDF viewer.',
        href: '/dashboard/resume',
        icon: FileText,
        color: 'bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400',
        border: 'hover:border-slate-300 dark:hover:border-slate-700',
      },
    ],
  },
  {
    group: 'Flashcards',
    items: [
      {
        label: 'Sets',
        description: 'Create and study flashcard sets with markdown and math support.',
        href: '/flashcards/sets',
        icon: Layers,
        color: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
        border: 'hover:border-purple-300 dark:hover:border-purple-700',
      },
      {
        label: 'Starred Cards',
        description: 'Review all cards you have starred across every set.',
        href: '/flashcards/starred',
        icon: Star,
        color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400',
        border: 'hover:border-yellow-300 dark:hover:border-yellow-700',
      },
      {
        label: 'Flashcard Skills',
        description: 'Track skills linked to your flashcard sets and proficiency.',
        href: '/flashcards/skills',
        icon: GraduationCap,
        color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400',
        border: 'hover:border-cyan-300 dark:hover:border-cyan-700',
      },
    ],
  },
  {
    group: 'Notes',
    items: [
      {
        label: 'Notes',
        description: 'Write grouped markdown notes with live split-pane preview.',
        href: '/notes',
        icon: NotebookPen,
        color: 'bg-lime-50 text-lime-600 dark:bg-lime-950 dark:text-lime-400',
        border: 'hover:border-lime-300 dark:hover:border-lime-700',
      },
    ],
  },
  {
    group: 'Other',
    items: [
      {
        label: '1-on-1 Documents',
        description: 'Create and export structured 1-on-1 meeting records.',
        href: '/dashboard/one-on-one',
        icon: Users,
        color: 'bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
        border: 'hover:border-violet-300 dark:hover:border-violet-700',
      },
      {
        label: 'Action Items',
        description: 'Keep track of tasks and follow-ups with priority levels.',
        href: '/dashboard/action-items',
        icon: CheckSquare,
        color: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
        border: 'hover:border-rose-300 dark:hover:border-rose-700',
      },
      {
        label: 'Images',
        description: 'Upload and manage photos and screenshots with labels.',
        href: '/dashboard/images',
        icon: ImageIcon,
        color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
        border: 'hover:border-orange-300 dark:hover:border-orange-700',
      },
    ],
  },
]

export default function DashboardPage() {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{greeting}, Aman.</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your commitment tracker. Select a section to get started.
        </p>
      </div>
      {sections.map(({ group, items }) => (
        <div key={group} className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">{group}</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map(({ label, description, href, icon: Icon, color, border }) => (
              <Link
                key={href}
                to={href}
                className={`group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all duration-150 hover:shadow-md ${border}`}
              >
                <div className={`w-fit rounded-lg p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="leading-snug font-semibold group-hover:underline">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
