import { db } from '@/lib/prisma'
import type { User } from '@prisma/client'

export async function findUserById(userId: string): Promise<User | null> {
  return db.user.findUnique({ where: { id: userId } })
}

export async function upsertUser(data: {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}): Promise<User> {
  return db.user.upsert({
    where: { id: data.id },
    create: data,
    update: {
      email: data.email,
      name: data.name,
      avatarUrl: data.avatarUrl,
    },
  })
}

export async function updateUserName(userId: string, name: string): Promise<User> {
  return db.user.update({
    where: { id: userId },
    data: { name },
  })
}
