'use client'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useRouter } from '@/lib/i18n/navigation'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Role } from '@prisma/client'

interface InviteAcceptCardProps {
  token: string
  projectName: string
  projectId: string
  invitedByName: string
  role: Role
  alreadyMember: boolean
  locale: string
}

export function InviteAcceptCard({
  token,
  projectName,
  projectId,
  invitedByName,
  role,
  alreadyMember,
  locale,
}: InviteAcceptCardProps) {
  const t = useTranslations()
  const router = useRouter()

  const accept = trpc.invites.accept.useMutation({
    onSuccess: () => {
      document.cookie = `active_project_id=${projectId}; path=/; max-age=${60 * 60 * 24 * 365}`
      toast.success(t('members.joined'))
      router.push(`/projects/${projectId}`)
    },
    onError: (err) => toast.error(err.message),
  })

  if (alreadyMember) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{t('errors.alreadyMember')}</p>
          <Button variant="outline" onClick={() => router.push(`/projects/${projectId}`)}>
            {t('common.back')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{projectName}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Invited by <span className="font-medium">{invitedByName}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('members.inviteRoleLabel')}:</span>
          <Badge variant="secondary">{t(`members.roles.${role}`)}</Badge>
        </div>
        <Button
          className="w-full"
          onClick={() => accept.mutate({ token })}
          disabled={accept.isPending}
        >
          {accept.isPending ? t('common.loading') : t('members.invite')}
        </Button>
      </CardContent>
    </Card>
  )
}
