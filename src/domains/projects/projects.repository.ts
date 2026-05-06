import { db } from '@/lib/prisma'
import type { Project } from '@prisma/client'

export async function findProjectsByUserId(userId: string) {
  return db.project.findMany({
    where: { members: { some: { userId } } },
    include: { members: { where: { userId }, select: { role: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function findProjectById(projectId: string): Promise<Project | null> {
  return db.project.findUnique({ where: { id: projectId } })
}

export async function createProject(data: {
  name: string
  slug: string
  userId: string
}): Promise<Project> {
  return db.project.create({
    data: {
      name: data.name,
      slug: data.slug,
      members: { create: { userId: data.userId, role: 'OWNER' } },
    },
  })
}

export async function updateProject(
  projectId: string,
  data: { name: string; slug: string },
): Promise<Project> {
  return db.project.update({ where: { id: projectId }, data })
}

export async function deleteProject(projectId: string): Promise<void> {
  await db.project.delete({ where: { id: projectId } })
}

export async function countUserOwnedProjects(userId: string): Promise<number> {
  return db.member.count({ where: { userId, role: 'OWNER' } })
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'project'

  let slug = base
  let counter = 1

  while (await db.project.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`
  }

  return slug
}
