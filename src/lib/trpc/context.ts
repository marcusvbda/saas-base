import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/prisma'

export async function createContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  // Lazy-sync: ensure the Supabase auth user has a matching row in our DB.
  // This runs on every authenticated tRPC call, so no webhooks are needed.
  if (user) {
    await db.user.upsert({
      where: { id: user.id },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email!,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      },
      update: {
        email: user.email!,
      },
    })
  }

  return { userId, db }
}

export type Context = Awaited<ReturnType<typeof createContext>>
