import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import { Geist } from 'next/font/google'
import { cookies } from 'next/headers'
import { Toaster } from 'sonner'
import { TRPCReactProvider } from '@/lib/trpc/react-provider'
import { routing } from '@/i18n/routing'
import '@/app/globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get('theme')?.value
  const defaultTheme = themeCookie === 'dark' || themeCookie === 'light' ? themeCookie : 'system'

  return (
    <html lang={locale} suppressHydrationWarning className={geist.variable}>
      <body>
        <ThemeProvider attribute="class" defaultTheme={defaultTheme} enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <TRPCReactProvider>
              {children}
              <Toaster richColors position="top-right" />
            </TRPCReactProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
