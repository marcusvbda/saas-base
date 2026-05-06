import { TRPCError } from '@trpc/server'
import { findUserById, upsertUser, updateUserName } from './users.repository'
import type { User } from '@prisma/client'

export async function getCurrentUser(userId: string): Promise<User> {
  const user = await findUserById(userId)
  if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' })
  return user
}

export async function syncUserFromClerk(data: {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}): Promise<User> {
  return upsertUser(data)
}

export async function updateUserProfile(userId: string, name: string): Promise<User> {
  return updateUserName(userId, name)
}
