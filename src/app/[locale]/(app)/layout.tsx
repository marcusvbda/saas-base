'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from '@/i18n/navigation'
import { AppShell } from '@/components/layouts/app-shell'
import { trpc } from '@/lib/trpc/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const schema = z.object({ name: z.string().min(2).max(50) })
type FormValues = z.infer<typeof schema>

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations()
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)

  const { data: projects = [], isLoading } = trpc.projects.list.useQuery()
  const { data: me } = trpc.users.me.useQuery()

  const activeProjectId =
    typeof document !== 'undefined'
      ? document.cookie
          .split('; ')
          .find((c) => c.startsWith('active_project_id='))
          ?.split('=')[1] ?? null
      : null

  const plan = me?.plan ?? 'FREE'
  const PLAN_PROJECT_LIMITS: Record<string, number> = { FREE: 1, PRO: 10, BUSINESS: 999 }
  const ownedCount = projects.filter((p) =>
    p.members.some((m) => m.role === 'OWNER'),
  ).length
  const canCreateMore = ownedCount < (PLAN_PROJECT_LIMITS[plan] ?? 1)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const createProject = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      document.cookie = `active_project_id=${project.id}; path=/; max-age=${60 * 60 * 24 * 365}`
      setCreateOpen(false)
      reset()
      toast.success(t('onboarding.success'))
      router.push(`/projects/${project.id}`)
    },
    onError: (err) => toast.error(err.message),
  })

  function onSubmit(values: FormValues) {
    createProject.mutate({ name: values.name })
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="hidden md:flex w-64 flex-col border-r p-4 gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <AppShell
        projects={projects.map((p) => ({ id: p.id, name: p.name }))}
        activeProjectId={activeProjectId}
        plan={plan}
        canCreateMore={canCreateMore}
        onCreateProject={() => setCreateOpen(true)}
      >
        {children}
      </AppShell>

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
              <Button
                type="button"
                variant="outline"
                onClick={() => { reset(); setCreateOpen(false) }}
                disabled={createProject.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? t('common.loading') : t('projects.create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
