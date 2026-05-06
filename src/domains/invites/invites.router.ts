import { router } from '@/lib/trpc/server'
import { authedProcedure } from '@/lib/trpc/middleware'
import {
  listInvitesSchema,
  createInviteSchema,
  acceptInviteSchema,
  revokeInviteSchema,
} from './invites.schemas'
import { listInvites, createInvite, acceptInvite, revokeInvite } from './invites.service'

export const invitesRouter = router({
  list: authedProcedure
    .input(listInvitesSchema)
    .query(async ({ ctx, input }) => {
      return listInvites(ctx.userId, input.projectId)
    }),

  create: authedProcedure
    .input(createInviteSchema)
    .mutation(async ({ ctx, input }) => {
      return createInvite(ctx.userId, input.projectId, input.email, input.role)
    }),

  accept: authedProcedure
    .input(acceptInviteSchema)
    .mutation(async ({ ctx, input }) => {
      return acceptInvite(ctx.userId, input.token)
    }),

  revoke: authedProcedure
    .input(revokeInviteSchema)
    .mutation(async ({ ctx, input }) => {
      return revokeInvite(ctx.userId, input.projectId, input.inviteId)
    }),
})
