'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-muted-foreground">{t('notFound')}</p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">{error.digest}</p>
      )}
      <Button onClick={reset} variant="outline">
        {useTranslations('common')('confirm')}
      </Button>
    </div>
  )
}
