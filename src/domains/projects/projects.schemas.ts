import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(2).max(50),
})

export const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(2).max(50),
})

export const projectIdSchema = z.object({
  projectId: z.string().min(1),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
