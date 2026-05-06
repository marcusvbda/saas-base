'use client'

import { useTranslations } from 'next-intl'
import { LayoutDashboard, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Link, usePathname } from '@/lib/i18n/navigation'
import { ProjectSwitcher } from '@/components/shared/project-switcher'
import { PlanBadge } from '@/components/shared/plan-badge'
import { UserMenu } from '@/components/shared/user-menu'
import type { Plan } from '@prisma/client'

interface NavItem {
  href: string
  labelKey: string
  icon: React.ElementType
}

function getNavItems(projectId: string | null): NavItem[] {
  return [
    { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    ...(projectId
      ? [
          { href: `/projects/${projectId}/members`, labelKey: 'nav.members', icon: Users },
          { href: `/projects/${projectId}/settings`, labelKey: 'nav.settings', icon: Settings },
        ]
      : []),
  ]
}

interface SidebarProps {
  projects: { id: string; name: string }[]
  activeProjectId: string | null
  plan: Plan
  canCreateMore: boolean
  onCreateProject: () => void
}

export function Sidebar({
  projects,
  activeProjectId,
  plan,
  canCreateMore,
  onCreateProject,
}: SidebarProps) {
  const t = useTranslations()
  const pathname = usePathname()
  const navItems = getNavItems(activeProjectId)

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      <div className="p-3 border-b">
        <ProjectSwitcher
          projects={projects}
          activeProjectId={activeProjectId}
          canCreateMore={canCreateMore}
          onCreateClick={onCreateProject}
        />
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(labelKey)}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t flex items-center justify-between gap-2">
        <PlanBadge plan={plan} />
        <UserMenu />
      </div>
    </aside>
  )
}
