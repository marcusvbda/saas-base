import { TRPCError } from '@trpc/server'
import { env } from '@/lib/env'
import { db } from '@/lib/prisma'
import {
  findPendingInvites,
  findInviteByToken,
  findExistingInvite,
  createInvite as createInviteInDb,
  deleteInvite,
  acceptInviteTransaction,
} from './invites.repository'
import { requireProjectAccess } from '@/domains/members/members.service'
import { findMember, countProjectMembers } from '@/domains/members/members.repository'
import { assertCan } from '@/domains/plans/plans.service'
import type { Role } from '@prisma/client'

export async function listInvites(userId: string, projectId: string) {
  await requireProjectAccess(userId, projectId, 'EDITOR')
  return findPendingInvites(projectId)
}

export async function createInvite(
  userId: string,
  projectId: string,
  email: string,
  role: Role,
) {
  await requireProjectAccess(userId, projectId, 'EDITOR')

  // Check target email is not already a member
  const targetUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (targetUser) {
    const alreadyMember = await findMember(targetUser.id, projectId)
    if (alreadyMember) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'already_member' })
    }
  }

  // Check invite for this email+project does not already exist
  const existingInvite = await findExistingInvite(email, projectId)
  if (existingInvite) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'invite_already_exists' })
  }

  // Use OWNER's plan for member limit check
  const owner = await db.member.findFirst({ where: { projectId, role: 'OWNER' } })
  if (!owner) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })

  const currentMemberCount = await countProjectMembers(projectId)
  await assertCan(owner.userId, 'members', { current: currentMemberCount })

  const invite = await createInviteInDb({ email, projectId, invitedById: userId, role })

  // TODO: send invite email via Resend — integrate here
  console.log(`[INVITE] ${env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`)

  return invite
}

export async function acceptInvite(userId: string, token: string) {
  const invite = await findInviteByToken(token)

  if (!invite || invite.expiresAt < new Date()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'invite_invalid_or_expired' })
  }

  const alreadyMember = await findMember(userId, invite.projectId)
  if (alreadyMember) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'already_member' })
  }

  await acceptInviteTransaction(invite.id, userId, invite.projectId, invite.role)

  return db.project.findUnique({ where: { id: invite.projectId } })
}

export async function revokeInvite(
  userId: string,
  projectId: string,
  inviteId: string,
) {
  await requireProjectAccess(userId, projectId, 'EDITOR')
  await deleteInvite(inviteId)
}
