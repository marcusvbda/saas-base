import { db } from '@/lib/prisma'
import { addDays } from 'date-fns'
import type { Invite, Role } from '@prisma/client'

export async function findPendingInvites(projectId: string): Promise<Invite[]> {
  return db.invite.findMany({
    where: { projectId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findInviteByToken(token: string): Promise<Invite | null> {
  return db.invite.findUnique({ where: { token } })
}

export async function findInviteById(inviteId: string): Promise<Invite | null> {
  return db.invite.findUnique({ where: { id: inviteId } })
}

export async function findExistingInvite(
  email: string,
  projectId: string,
): Promise<Invite | null> {
  return db.invite.findUnique({
    where: { email_projectId: { email, projectId } },
  })
}

export async function createInvite(data: {
  email: string
  projectId: string
  invitedById: string
  role: Role
}): Promise<Invite> {
  return db.invite.create({
    data: {
      email: data.email,
      projectId: data.projectId,
      invitedById: data.invitedById,
      role: data.role,
      expiresAt: addDays(new Date(), 7),
    },
  })
}

export async function deleteInvite(inviteId: string): Promise<void> {
  await db.invite.delete({ where: { id: inviteId } })
}

export async function acceptInviteTransaction(
  inviteId: string,
  userId: string,
  projectId: string,
  role: Role,
): Promise<void> {
  await db.$transaction([
    db.member.create({ data: { userId, projectId, role } }),
    db.invite.delete({ where: { id: inviteId } }),
  ])
}
