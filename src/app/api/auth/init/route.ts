import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listUserProjects } from '@/domains/projects/projects.service'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/sign-in`)
  }

  const projects = await listUserProjects(user.id)

  if (projects.length === 0) {
    return NextResponse.redirect(`${origin}/onboarding`)
  }

  const response = NextResponse.redirect(`${origin}/`)
  response.cookies.set('active_project_id', projects[0].id, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}
