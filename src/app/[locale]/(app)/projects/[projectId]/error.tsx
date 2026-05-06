'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const tErr = useTranslations('errors')
  const tCommon = useTranslations('common')

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <p className="text-muted-foreground">{tErr('notFound')}</p>
      {error.digest && (
        <p className="text-xs font-mono text-muted-foreground">{error.digest}</p>
      )}
      <Button onClick={reset} variant="outline">{tCommon('back')}</Button>
    </div>
  )
}
