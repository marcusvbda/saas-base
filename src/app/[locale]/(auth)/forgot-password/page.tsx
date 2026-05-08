'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const schema = z.object({ email: z.email() })
type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const t = useTranslations()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${location.origin}/api/auth/callback?next=/reset-password`,
    })
    if (authError) {
      setError(authError.message)
      return
    }
    setSent(true)
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{t('auth.forgotPassword')}</CardTitle>
        <CardDescription>{t('auth.forgotPasswordDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="grid gap-6">
            <p className="text-center text-sm text-muted-foreground">
              {t('auth.resetLinkSent')}
            </p>
            <div className="text-center text-sm">
              <Link href="/sign-in" className="underline underline-offset-4">
                {t('auth.backToSignIn')}
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('common.loading') : t('auth.sendResetLink')}
              </Button>
              <div className="text-center text-sm">
                <Link href="/sign-in" className="underline underline-offset-4">
                  {t('auth.backToSignIn')}
                </Link>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
