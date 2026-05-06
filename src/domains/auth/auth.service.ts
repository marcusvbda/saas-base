import type { User } from '@supabase/supabase-js'

export function getDisplayName(user: User): string {
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    'Unknown'
  )
}

export function getAvatarUrl(user: User): string | null {
  return user.user_metadata?.avatar_url ?? null
}
