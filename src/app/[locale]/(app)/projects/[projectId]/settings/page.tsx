'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from '@/lib/i18n/navigation'
import { trpc } from '@/lib/trpc/client'
import { PageHeader } from '@/components/shared/page-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const schema = z.object({ name: z.string().min(2).max(50) })
type FormValues = z.infer<typeof schema>

export default function ProjectSettingsPage() {
  const t = useTranslations()
  const router = useRouter()
  const params = useParams<{ projectId: string }>()
  const projectId = params.projectId

  const { data: project } = trpc.projects.get.useQuery({ projectId })
  const utils = trpc.useUtils()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (project) reset({ name: project.name })
  }, [project, reset])

  const update = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate()
      utils.projects.get.invalidate({ projectId })
      toast.success(t('common.save') + '!')
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      document.cookie = 'active_project_id=; path=/; max-age=0'
      router.push('/dashboard')
    },
    onError: (err) => toast.error(err.message),
  })

  if (!project) return null

  return (
    <div className="max-w-xl">
      <PageHeader title={t('projects.settings')} />

      <form onSubmit={handleSubmit((v) => update.mutate({ projectId, name: v.name }))} className="space-y-4">
        <fieldset disabled={isSubmitting || update.isPending} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">{t('onboarding.projectNameLabel')}</Label>
            <Input id="project-name" {...register('name')} placeholder={t('projects.namePlaceholder')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <Button type="submit" disabled={!isDirty || isSubmitting || update.isPending}>
            {update.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </fieldset>
      </form>

      <Separator className="my-8" />

      <div className="rounded-lg border border-destructive/50 p-4 space-y-3">
        <h3 className="font-semibold text-destructive">{t('common.delete')}</h3>
        <p className="text-sm text-muted-foreground">{t('projects.deleteConfirm')}</p>
        <ConfirmDialog
          title={t('projects.delete')}
          description={t('projects.deleteConfirm')}
          confirmLabel={t('common.delete')}
          variant="destructive"
          requireTyping={project.name}
          onConfirm={() => deleteProject.mutate({ projectId })}
        >
          <Button variant="destructive" size="sm">
            {t('projects.delete')}
          </Button>
        </ConfirmDialog>
      </div>
    </div>
  )
}
