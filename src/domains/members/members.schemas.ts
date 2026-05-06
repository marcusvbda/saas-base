import { z } from 'zod'

export const projectIdSchema = z.object({
  projectId: z.string().min(1),
})

export const updateRoleSchema = z.object({
  projectId: z.string().min(1),
  memberId: z.string().min(1),
  role: z.enum(['EDITOR', 'VIEWER']), // cannot set to OWNER
})

export const removeMemberSchema = z.object({
  projectId: z.string().min(1),
  memberId: z.string().min(1),
})

export const leaveProjectSchema = z.object({
  projectId: z.string().min(1),
})
