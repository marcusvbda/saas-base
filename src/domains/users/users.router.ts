import { router, publicProcedure } from '@/lib/trpc/server'
import { authedProcedure } from '@/lib/trpc/middleware'
import { getCurrentUser, syncUserFromClerk, updateUserProfile } from './users.service'
import { updateProfileSchema, syncFromClerkSchema } from './users.schemas'

export const usersRouter = router({
  me: authedProcedure.query(async ({ ctx }) => {
    return getCurrentUser(ctx.userId)
  }),

  // Internal — called from Clerk webhook handler via server-side caller, not the HTTP tRPC endpoint
  syncFromClerk: publicProcedure
    .input(syncFromClerkSchema)
    .mutation(async ({ input }) => {
      return syncUserFromClerk(input)
    }),

  updateProfile: authedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return updateUserProfile(ctx.userId, input.name)
    }),
})
