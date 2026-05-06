import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/prisma'
import { InviteAcceptCard } from './invite-accept-card'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { locale, token } = await params

  if (!user) {
    redirect(`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/invite/${token}`)}`)
  }

  const t = await getTranslations()

  const invite = await db.invite.findUnique({
    where: { token },
    include: {
      project: { select: { id: true, name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  })

  const isValid = invite && invite.expiresAt > new Date()

  if (!isValid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">{t('errors.inviteExpired')}</p>
          <a href={`/${locale}/sign-in`} className="text-sm underline">
            {t('auth.signIn')}
          </a>
        </div>
      </div>
    )
  }

  const alreadyMember = await db.member.findUnique({
    where: { userId_projectId: { userId: user.id, projectId: invite.projectId } },
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <InviteAcceptCard
        token={token}
        projectName={invite.project.name}
        projectId={invite.projectId}
        invitedByName={invite.invitedBy.name ?? invite.invitedBy.email}
        role={invite.role}
        alreadyMember={!!alreadyMember}
        locale={locale}
      />
    </div>
  )
}
