import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createCaller } from '@/lib/trpc/router'
import { createContext } from '@/lib/trpc/context'
import { can } from '@/domains/plans/plans.service'
import { LimitIndicator } from '@/components/shared/limit-indicator'
import { PageHeader } from '@/components/shared/page-header'
import { MembersContent } from './members-content'

export default async function MembersPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { projectId } = await params
  const t = await getTranslations()
  const caller = createCaller(await createContext())

  const [members, invites, me] = await Promise.all([
    caller.members.list({ projectId }),
    caller.invites.list({ projectId }).catch(() => []),
    caller.users.me(),
  ])

  const myMember = members.find((m) => m.userId === user.id)
  const role = myMember?.role ?? 'VIEWER'

  const canInvite = await can(me.id, 'members', { current: members.length })

  return (
    <div>
      <PageHeader title={t('nav.members')} />
      <div className="mb-6">
        <LimitIndicator
          current={members.length}
          max={me.plan === 'FREE' ? 3 : me.plan === 'PRO' ? 15 : 999}
          labelKey="limits.members"
        />
      </div>
      <MembersContent
        projectId={projectId}
        members={members}
        invites={invites}
        myUserId={user.id}
        myRole={role}
        canInvite={canInvite.allowed}
      />
    </div>
  )
}
