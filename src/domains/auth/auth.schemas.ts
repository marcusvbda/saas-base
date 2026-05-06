import { z } from 'zod'

export const supabaseUserMetadataSchema = z.object({
  full_name: z.string().optional(),
  name: z.string().optional(),
  avatar_url: z.string().optional(),
})

export type SupabaseUserMetadata = z.infer<typeof supabaseUserMetadataSchema>
