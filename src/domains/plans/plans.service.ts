import { unstable_cache } from 'next/cache'
import { TRPCError } from '@trpc/server'
import { db } from '@/lib/prisma'
import { GATES, type GateAction, type CanResult } from './plans.gates'
import type { Plan } from '@prisma/client'

const fetchUserPlan = async (userId: string): Promise<Plan> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })
  return user?.plan ?? 'FREE'
}

export async function getUserPlan(userId: string): Promise<Plan> {
  return unstable_cache(fetchUserPlan, ['user-plan'], { revalidate: 60 })(userId)
}

export async function can(
  userId: string,
  action: GateAction,
  context?: { current: number },
): Promise<CanResult> {
  const plan = await getUserPlan(userId)
  const gate = GATES[plan][action]

  if (typeof gate === 'boolean') {
    return gate
      ? { allowed: true }
      : { allowed: false, reason: 'upgrade_required' }
  }

  // Numeric gate — context.current required
  if (context === undefined) {
    throw new Error(`context.current is required for numeric gate '${action}'`)
  }

  return context.current < gate
    ? { allowed: true }
    : { allowed: false, reason: 'limit_reached', limit: gate }
}

export async function assertCan(
  userId: string,
  action: GateAction,
  context?: { current: number },
): Promise<void> {
  const result = await can(userId, action, context)
  if (!result.allowed) {
    throw new TRPCError({ code: 'FORBIDDEN', message: result.reason })
  }
}
