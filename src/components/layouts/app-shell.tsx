'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'
import type { Plan } from '@prisma/client'

interface AppShellProps {
  children: React.ReactNode
  projects: { id: string; name: string }[]
  activeProjectId: string | null
  plan: Plan
  canCreateMore: boolean
  onCreateProject: () => void
  pageTitle?: string
}

export function AppShell({
  children,
  projects,
  activeProjectId,
  plan,
  canCreateMore,
  onCreateProject,
  pageTitle,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarProps = { projects, activeProjectId, plan, canCreateMore, onCreateProject }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:shrink-0">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile sidebar via Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-2 border-b px-4 h-14">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="hidden md:block">
          <TopBar title={pageTitle} />
        </div>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
