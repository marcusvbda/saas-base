import { z } from 'zod'

export const listInvitesSchema = z.object({
  projectId: z.string().min(1),
})

export const createInviteSchema = z.object({
  projectId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['EDITOR', 'VIEWER']), // cannot invite as OWNER
})

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
})

export const revokeInviteSchema = z.object({
  projectId: z.string().min(1),
  inviteId: z.string().min(1),
})
