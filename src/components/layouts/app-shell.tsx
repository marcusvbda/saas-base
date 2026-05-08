'use client'

import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { LocaleSwitcher } from '@/components/shared/locale-switcher'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AppSidebar } from './app-sidebar'
import type { Plan } from '@prisma/client'

interface AppShellProps {
  children: React.ReactNode
  projects: { id: string; name: string }[]
  activeProjectId: string | null
  plan: Plan
  canCreateMore: boolean
  onCreateProject: () => void
}

export function AppShell({
  children,
  projects,
  activeProjectId,
  plan,
  canCreateMore,
  onCreateProject,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        plan={plan}
        canCreateMore={canCreateMore}
        onCreateProject={onCreateProject}
      />
      <SidebarInset>
        <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            <div className="ml-auto flex items-center gap-1">
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
