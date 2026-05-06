import { can } from '@/domains/plans/plans.service'
import type { GateAction } from '@/domains/plans/plans.gates'
import { UpgradePrompt } from './upgrade-prompt'

interface GateProps {
  userId: string
  action: GateAction
  context?: { current: number }
  children: React.ReactNode
  fallback?: React.ReactNode
}

export async function Gate({ userId, action, context, children, fallback }: GateProps) {
  const result = await can(userId, action, context)

  if (result.allowed) return <>{children}</>

  return <>{fallback ?? <UpgradePrompt size="inline" />}</>
}
