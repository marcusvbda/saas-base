import { TRPCError } from '@trpc/server'
import {
  findProjectsByUserId,
  findProjectById,
  createProject as createProjectInDb,
  updateProject as updateProjectInDb,
  deleteProject as deleteProjectInDb,
  countUserOwnedProjects,
  generateUniqueSlug,
} from './projects.repository'
import { requireProjectAccess } from '@/domains/members/members.service'
import { assertCan } from '@/domains/plans/plans.service'

export async function listUserProjects(userId: string) {
  return findProjectsByUserId(userId)
}

export async function createProject(userId: string, name: string) {
  const current = await countUserOwnedProjects(userId)
  await assertCan(userId, 'projects', { current })

  const slug = await generateUniqueSlug(name)
  return createProjectInDb({ name, slug, userId })
}

export async function getProject(userId: string, projectId: string) {
  await requireProjectAccess(userId, projectId, 'VIEWER')
  const project = await findProjectById(projectId)
  if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'project_not_found' })
  return project
}

export async function updateProject(
  userId: string,
  projectId: string,
  name: string,
) {
  await requireProjectAccess(userId, projectId, 'OWNER')
  const slug = await generateUniqueSlug(name)
  return updateProjectInDb(projectId, { name, slug })
}

export async function deleteProject(userId: string, projectId: string) {
  await requireProjectAccess(userId, projectId, 'OWNER')
  await deleteProjectInDb(projectId)
}
