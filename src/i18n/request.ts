import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let requested = await requestLocale

  if (!requested || !routing.locales.includes(requested as (typeof routing.locales)[number])) {
    try {
      const cookieStore = await cookies()
      const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
      if (cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])) {
        requested = cookieLocale
      }
    } catch (_) {
      // noop
    }
  }

  const locale = routing.locales.includes(requested as (typeof routing.locales)[number])
    ? (requested as (typeof routing.locales)[number])
    : routing.defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}/index`)).default,
    onError: () => null,
    getMessageFallback: ({ key }) => key,
  }
})
