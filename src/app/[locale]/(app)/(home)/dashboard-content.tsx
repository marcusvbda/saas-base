'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from '@/i18n/navigation'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UpgradePrompt } from '@/components/shared/upgrade-prompt'

type Plan = 'FREE' | 'PRO' | 'BUSINESS'
type Role = 'OWNER' | 'EDITOR' | 'VIEWER'

interface Project {
  id: string
  name: string
  createdAt: Date
  members: { role: Role }[]
}

interface DashboardContentProps {
  projects: Project[]
  activeProjectId: string | null
  canCreateMore: boolean
  plan: Plan
}

const schema = z.object({ name: z.string().min(2).max(50) })
type FormValues = z.infer<typeof schema>

export function DashboardContent({
  projects,
  activeProjectId,
  canCreateMore,
  plan,
}: DashboardContentProps) {
  const t = useTranslations()
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const utils = trpc.useUtils()
  const create = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      document.cookie = `active_project_id=${project.id}; path=/; max-age=${60 * 60 * 24 * 365}`
      toast.success(t('onboarding.success'))
      utils.projects.list.invalidate()
      setCreateOpen(false)
      reset()
      router.push(`/projects/${project.id}`)
    },
    onError: (err) => toast.error(err.message),
  })

  function handleNewProject() {
    if (!canCreateMore) { setShowUpgrade(true); return }
    setCreateOpen(true)
  }

  function onSubmit(values: FormValues) {
    create.mutate({ name: values.name })
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleNewProject} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t('projects.create')}
        </Button>
      </div>

      {showUpgrade && (
        <div className="mb-6">
          <UpgradePrompt size="card" />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const role = project.members[0]?.role ?? 'VIEWER'
          const isActive = project.id === activeProjectId
          return (
            <Card
              key={project.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${isActive ? 'ring-2 ring-primary' : ''}`}
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base truncate">{project.name}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {t(`members.roles.${role}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{project.members.length}</span>
                  <span className="ml-auto text-xs">
                    {format(new Date(project.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) reset(); setCreateOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('projects.create')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="project-name">{t('onboarding.projectNameLabel')}</Label>
              <Input
                id="project-name"
                {...register('name')}
                placeholder={t('onboarding.projectNamePlaceholder')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { reset(); setCreateOpen(false) }}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? t('common.loading') : t('projects.create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
