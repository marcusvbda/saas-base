import { router } from '@/lib/trpc/server'
import { authedProcedure } from '@/lib/trpc/middleware'
import { createProjectSchema, updateProjectSchema, projectIdSchema } from './projects.schemas'
import {
  listUserProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from './projects.service'

export const projectsRouter = router({
  list: authedProcedure.query(async ({ ctx }) => {
    return listUserProjects(ctx.userId)
  }),

  create: authedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      return createProject(ctx.userId, input.name)
    }),

  get: authedProcedure
    .input(projectIdSchema)
    .query(async ({ ctx, input }) => {
      return getProject(ctx.userId, input.projectId)
    }),

  update: authedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      return updateProject(ctx.userId, input.projectId, input.name)
    }),

  delete: authedProcedure
    .input(projectIdSchema)
    .mutation(async ({ ctx, input }) => {
      await deleteProject(ctx.userId, input.projectId)
      return { success: true }
    }),
})
