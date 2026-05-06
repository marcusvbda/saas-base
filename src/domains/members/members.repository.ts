import { db } from '@/lib/prisma'
import type { Member, Role } from '@prisma/client'

export async function findMember(
  userId: string,
  projectId: string,
): Promise<Member | null> {
  return db.member.findUnique({
    where: { userId_projectId: { userId, projectId } },
  })
}

export async function findMemberById(memberId: string): Promise<Member | null> {
  return db.member.findUnique({ where: { id: memberId } })
}

export async function findProjectMembers(projectId: string) {
  return db.member.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  })
}

export async function updateMemberRole(memberId: string, role: Role): Promise<Member> {
  return db.member.update({ where: { id: memberId }, data: { role } })
}

export async function deleteMember(memberId: string): Promise<void> {
  await db.member.delete({ where: { id: memberId } })
}

export async function countProjectOwners(projectId: string): Promise<number> {
  return db.member.count({ where: { projectId, role: 'OWNER' } })
}

export async function countProjectMembers(projectId: string): Promise<number> {
  return db.member.count({ where: { projectId } })
}
