import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createCaller } from '@/lib/trpc/router'
import { createContext } from '@/lib/trpc/context'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const cookieStore = await cookies()
  const activeProjectId = cookieStore.get('active_project_id')?.value
  if (!activeProjectId) redirect('/onboarding')

  const t = await getTranslations()
  const caller = createCaller(await createContext())

  const [project, members] = await Promise.all([
    caller.projects.get({ projectId: activeProjectId }),
    caller.members.list({ projectId: activeProjectId }),
  ])

  const myMember = members.find((m) => m.userId === user.id)
  const role = myMember?.role ?? 'VIEWER'

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 px-4 lg:px-6">
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{members.length} {t('nav.members').toLowerCase()}</span>
          </div>
          <Badge variant="secondary">{t(`members.roles.${role}`)}</Badge>
        </div>
      </div>
      <div className="mx-4 lg:mx-6 rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-sm">
          Product content goes here — replace this placeholder.
        </p>
      </div>
    </>
  )
}
