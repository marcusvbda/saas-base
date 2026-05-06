import { TRPCError } from '@trpc/server'
import { middleware, publicProcedure } from './server'

const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } })
})

export const authedProcedure = publicProcedure.use(isAuthed)
