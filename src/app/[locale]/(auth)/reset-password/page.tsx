'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Link } from '@/i18n/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const schema = z
  .object({
    password: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  })
type FormValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const t = useTranslations()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password: values.password })
    if (authError) {
      setError(authError.message)
      return
    }
    router.push('/sign-in')
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('auth.resetPassword')}</CardTitle>
        <CardDescription>{t('auth.resetPasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
              <PasswordInput
                id="password"
                {...register('password')}
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <PasswordInput
                id="confirmPassword"
                {...register('confirmPassword')}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message === 'passwordMismatch'
                    ? t('auth.passwordMismatch')
                    : errors.confirmPassword.message}
                </p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('auth.resetPassword')}
            </Button>
            <div className="text-center text-sm">
              <Link href="/sign-in" className="underline underline-offset-4">
                {t('auth.backToSignIn')}
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
