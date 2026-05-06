import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
})

export const syncFromClerkSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type SyncFromClerkInput = z.infer<typeof syncFromClerkSchema>
