import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createCaller } from '@/lib/trpc/router'
import { createContext } from '@/lib/trpc/context'
import { can } from '@/domains/plans/plans.service'
import { PageHeader } from '@/components/shared/page-header'
import { LimitIndicator } from '@/components/shared/limit-indicator'
import { DashboardContent } from './dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const t = await getTranslations()
  const caller = createCaller(await createContext())
  const [projects, me] = await Promise.all([
    caller.projects.list(),
    caller.users.me(),
  ])

  const ownedCount = projects.filter((p) =>
    p.members.some((m) => m.role === 'OWNER'),
  ).length
  const canResult = await can(user.id, 'projects', { current: ownedCount })
  const limit = canResult.allowed ? null : (canResult.limit ?? null)
  const maxProjects =
    limit ??
    (me.plan === 'FREE' ? 1 : me.plan === 'PRO' ? 10 : 999)

  const cookieStore = await cookies()
  const activeProjectId = cookieStore.get('active_project_id')?.value ?? null

  return (
    <div>
      <PageHeader title={t('nav.dashboard')} />
      <div className="mb-6">
        <LimitIndicator
          current={ownedCount}
          max={maxProjects}
          labelKey="limits.projects"
        />
      </div>
      <DashboardContent
        projects={projects}
        activeProjectId={activeProjectId}
        canCreateMore={canResult.allowed}
        plan={me.plan}
      />
    </div>
  )
}
