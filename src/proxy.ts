import { routing } from '@/lib/i18n/config'
import { updateSession } from '@/lib/supabase/middleware'
import createMiddleware from 'next-intl/middleware'
import { type NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware(routing)

const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/invite', '/auth']
const ONBOARDING_PATH = '/onboarding'

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || '/'
    }
  }
  return pathname
}

function isPublicPath(localePath: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => localePath === p || localePath.startsWith(`${p}/`),
  )
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // API and tRPC routes must never go through locale routing
  if (pathname.startsWith('/api/') || pathname.startsWith('/trpc/')) {
    return NextResponse.next()
  }

  const localePath = stripLocale(pathname)
  const locale =
    routing.locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ??
    routing.defaultLocale

  // Locale routing always runs first
  const intlResponse = intlMiddleware(req)

  // Skip auth checks for public paths
  if (isPublicPath(localePath)) return intlResponse

  // Refresh the Supabase session on every protected request
  const { supabaseResponse, user } = await updateSession(req)

  // Not authenticated — redirect to sign-in, preserving the intended URL
  if (!user) {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}/sign-in`
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const isOnboarding =
    localePath === ONBOARDING_PATH || localePath.startsWith(`${ONBOARDING_PATH}/`)
  const hasActiveProject = req.cookies.has('active_project_id')

  // Authenticated + on onboarding + already has a project → go to dashboard
  if (isOnboarding && hasActiveProject) {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}/dashboard`
    return NextResponse.redirect(url)
  }

  // Authenticated + app route + no project cookie → go to onboarding
  if (!isOnboarding && !hasActiveProject) {
    const url = req.nextUrl.clone()
    url.pathname = `/${locale}/onboarding`
    return NextResponse.redirect(url)
  }

  // Propagate the refreshed Supabase session cookies from supabaseResponse
  supabaseResponse.headers.forEach((value, key) => {
    intlResponse.headers.set(key, value)
  })
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value, cookie)
  })

  return intlResponse
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
