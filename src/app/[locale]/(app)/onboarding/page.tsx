'use client'

import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from '@/lib/i18n/navigation'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  name: z.string().min(2).max(50),
})
type FormValues = z.infer<typeof schema>

export default function OnboardingPage() {
  const t = useTranslations()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const create = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      document.cookie = `active_project_id=${project.id}; path=/; max-age=${60 * 60 * 24 * 365}`
      toast.success(t('onboarding.success'))
      router.push('/dashboard')
    },
    onError: (err) => toast.error(err.message),
  })

  function onSubmit(values: FormValues) {
    create.mutate({ name: values.name })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('onboarding.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <fieldset disabled={isSubmitting || create.isPending} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t('onboarding.projectNameLabel')}</Label>
                <Input
                  id="name"
                  placeholder={t('onboarding.projectNamePlaceholder')}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || create.isPending}
              >
                {isSubmitting || create.isPending
                  ? t('common.loading')
                  : t('onboarding.submit')}
              </Button>
            </fieldset>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
