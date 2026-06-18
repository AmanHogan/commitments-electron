import { Link } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Lightbulb,
  Briefcase,
  Users,
  CheckSquare,
  Sparkles,
  FileText,
  Layers,
  Star,
  TrendingUp,
  BookMarked,
  CalendarCheck,
  CalendarRange,
} from 'lucide-react'

const navItems = {
  dashboard: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  business: [
    {
      label: 'Business Partner Impact',
      href: '/dashboard/business-commitments',
      icon: ClipboardList
    },
    { label: 'TDP Program Impact', href: '/dashboard/business-commitments-two', icon: Briefcase }
  ],
  development: [
    { label: 'Development Commitment', href: '/dashboard/development-commitments-one', icon: BookOpen },
    { label: 'Innovation Commitment', href: '/dashboard/development-commitments-two', icon: Lightbulb },
    { label: 'Skills', href: '/dashboard/skills', icon: Sparkles },
    { label: 'Resume', href: '/dashboard/resume', icon: FileText }
  ],
  oneOnOne: [{ label: 'One on One Documents', href: '/dashboard/one-on-one', icon: Users }],
  reviews: [
    { label: 'Progressions', href: '/dashboard/progressions', icon: TrendingUp },
    { label: 'Mid-year Review', href: '/dashboard/review/midyear', icon: CalendarCheck },
    { label: 'End-of-year Review', href: '/dashboard/review/endofyear', icon: CalendarRange },
  ],
  flashcards: [
    { label: 'Sets', href: '/flashcards/sets', icon: Layers },
    { label: 'Starred', href: '/flashcards/starred', icon: Star },
  ],
  other: [
    { label: 'Action Items', href: '/dashboard/action-items', icon: CheckSquare },
    { label: 'TDP Docs / Guide', href: '/docs/tdp', icon: BookMarked },
  ]
}

function SidebarSection({ title, items }: { title: string; items: typeof navItems.business }) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map(({ label, href, icon: Icon }) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === href}
                className="h-auto overflow-visible py-2"
              >
                <Link to={href} className="flex w-full items-start gap-2">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="!truncate-none max-w-full break-words whitespace-normal">
                    {label}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Commitment Tracker</p>
          <p className="text-xs text-muted-foreground">Quick access to all sections</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-4">
        <SidebarSection title="Dashboard" items={navItems.dashboard} />
        <SidebarSection title="Business" items={navItems.business} />
        <SidebarSection title="Development" items={navItems.development} />
        <SidebarSection title="One on One Documents" items={navItems.oneOnOne} />
        <SidebarSection title="Reviews" items={navItems.reviews} />
        <SidebarSection title="Flashcards" items={navItems.flashcards} />
        <SidebarSection title="Other" items={navItems.other} />
      </SidebarContent>
    </Sidebar>
  )
}
