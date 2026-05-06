'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { User } from '@supabase/supabase-js'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { trpc } from '@/lib/trpc/client'
import { PlanBadge } from '@/components/shared/plan-badge'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({ name: z.string().min(1).max(100) })
type FormValues = z.infer<typeof schema>

export default function ProfilePage() {
  const t = useTranslations()
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const { data: me } = trpc.users.me.useQuery()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setSupabaseUser(data.user))
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (me) reset({ name: me.name ?? '' })
  }, [me, reset])

  const update = trpc.users.updateProfile.useMutation({
    onSuccess: () => toast.success(t('common.save') + '!'),
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="max-w-lg">
      <PageHeader title={t('nav.profile')} />

      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">{t('billing.currentPlan')}:</span>
        {me && <PlanBadge plan={me.plan} />}
      </div>

      <form
        onSubmit={handleSubmit((v) => update.mutate({ name: v.name }))}
        className="space-y-4"
      >
        <fieldset disabled={isSubmitting || update.isPending} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('auth.name')}</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              value={supabaseUser?.email ?? ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email is managed by Supabase Auth.
            </p>
          </div>

          <Button type="submit" disabled={!isDirty || isSubmitting || update.isPending}>
            {update.isPending ? t('common.loading') : t('common.save')}
          </Button>
        </fieldset>
      </form>
    </div>
  )
}
