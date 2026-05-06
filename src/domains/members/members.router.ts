import { router } from '@/lib/trpc/server'
import { authedProcedure } from '@/lib/trpc/middleware'
import { TRPCError } from '@trpc/server'
import {
  projectIdSchema,
  updateRoleSchema,
  removeMemberSchema,
  leaveProjectSchema,
} from './members.schemas'
import { requireProjectAccess } from './members.service'
import {
  findProjectMembers,
  findMemberById,
  updateMemberRole,
  deleteMember,
  countProjectOwners,
} from './members.repository'

export const membersRouter = router({
  list: authedProcedure
    .input(projectIdSchema)
    .query(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.userId, input.projectId, 'VIEWER')
      return findProjectMembers(input.projectId)
    }),

  updateRole: authedProcedure
    .input(updateRoleSchema)
    .mutation(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.userId, input.projectId, 'OWNER')

      const target = await findMemberById(input.memberId)
      if (!target || target.projectId !== input.projectId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      if (target.userId === ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'cannot_change_own_role' })
      }
      if (target.role === 'OWNER') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'cannot_change_owner_role' })
      }

      // TODO: ownership transfer not implemented
      return updateMemberRole(input.memberId, input.role)
    }),

  remove: authedProcedure
    .input(removeMemberSchema)
    .mutation(async ({ ctx, input }) => {
      await requireProjectAccess(ctx.userId, input.projectId, 'OWNER')

      const target = await findMemberById(input.memberId)
      if (!target || target.projectId !== input.projectId) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      if (target.userId === ctx.userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'cannot_remove_self' })
      }

      const ownerCount = await countProjectOwners(input.projectId)
      if (target.role === 'OWNER' && ownerCount <= 1) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'last_owner' })
      }

      await deleteMember(input.memberId)
    }),

  leave: authedProcedure
    .input(leaveProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const member = await requireProjectAccess(ctx.userId, input.projectId, 'VIEWER')

      if (member.role === 'OWNER') {
        const ownerCount = await countProjectOwners(input.projectId)
        if (ownerCount <= 1) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'last_owner' })
        }
      }

      await deleteMember(member.id)
    }),
})
