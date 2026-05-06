import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createCaller } from '@/lib/trpc/router'
import { createContext } from '@/lib/trpc/context'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

export default async function ProjectPage({
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

  const [project, members] = await Promise.all([
    caller.projects.get({ projectId }),
    caller.members.list({ projectId }),
  ])

  const myMember = members.find((m) => m.userId === user.id)
  const role = myMember?.role ?? 'VIEWER'

  return (
    <div>
      <PageHeader title={project.name} />
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          <span>{members.length} {t('nav.members').toLowerCase()}</span>
        </div>
        <Badge variant="secondary">{t(`members.roles.${role}`)}</Badge>
      </div>

      {/* TODO: Add product-specific content here */}
      <div className="mt-8 rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-sm">
          Product content goes here — replace this placeholder.
        </p>
      </div>
    </div>
  )
}
