import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { MailCheck } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function ConfirmEmailPage() {
  const t = await getTranslations()

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <MailCheck className="size-10 text-primary" />
        </div>
        <CardTitle className="text-xl">{t('auth.confirmEmail')}</CardTitle>
        <CardDescription>{t('auth.confirmEmailDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-sm">
          <Link href="/sign-in" className="underline underline-offset-4">
            {t('auth.backToSignIn')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
