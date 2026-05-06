import { TRPCError } from '@trpc/server'
import { findMember } from './members.repository'
import type { Member, Role } from '@prisma/client'

const ROLE_RANK: Record<Role, number> = {
  OWNER:  3,
  EDITOR: 2,
  VIEWER: 1,
}

export function hasRole(actual: Role, minimum: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[minimum]
}

export async function requireProjectAccess(
  userId: string,
  projectId: string,
  minimumRole: Role = 'VIEWER',
): Promise<Member> {
  const member = await findMember(userId, projectId)

  if (!member) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'project_not_found' })
  }

  if (!hasRole(member.role, minimumRole)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'insufficient_role' })
  }

  return member
}

export async function getMemberRole(
  userId: string,
  projectId: string,
): Promise<Role | null> {
  const member = await findMember(userId, projectId)
  return member?.role ?? null
}
