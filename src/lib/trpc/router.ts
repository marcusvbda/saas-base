import { router, createCallerFactory } from './server'
import { usersRouter } from '@/domains/users/users.router'
import { projectsRouter } from '@/domains/projects/projects.router'
import { membersRouter } from '@/domains/members/members.router'
import { invitesRouter } from '@/domains/invites/invites.router'
import { billingRouter } from '@/domains/billing/billing.router'

export const appRouter = router({
  users: usersRouter,
  projects: projectsRouter,
  members: membersRouter,
  invites: invitesRouter,
  billing: billingRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
