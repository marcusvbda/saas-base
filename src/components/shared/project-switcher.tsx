'use client'

import { useTranslations } from 'next-intl'
import { ChevronsUpDown, FolderOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from '@/i18n/navigation'

interface Project {
  id: string
  name: string
}

interface ProjectSwitcherProps {
  projects: Project[]
  activeProjectId: string | null
  canCreateMore: boolean
  onCreateClick: () => void
}

export function ProjectSwitcher({
  projects,
  activeProjectId,
  canCreateMore,
  onCreateClick,
}: ProjectSwitcherProps) {
  const t = useTranslations('projects')
  const router = useRouter()

  const active = projects.find((p) => p.id === activeProjectId) ?? projects[0]

  function switchProject(id: string) {
    document.cookie = `active_project_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.push(`/projects/${id}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between px-2">
          <div className="flex items-center gap-2 min-w-0">
            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">
              {active?.name ?? t('emptyTitle')}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {projects.map((p) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => switchProject(p.id)}
            className={p.id === activeProjectId ? 'font-semibold' : ''}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            <span className="truncate">{p.name}</span>
          </DropdownMenuItem>
        ))}
        {projects.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem
          onClick={onCreateClick}
          className={!canCreateMore ? 'text-muted-foreground' : ''}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('create')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
