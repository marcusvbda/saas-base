import { headers } from "next/headers"
import { getDictionary, Locale, locales } from "@/i18n/dictionaries"
import { redirect } from "next/navigation"
import { SystemProvider } from "@/providers/system.provider"

interface IProps {
    params: Promise<{ locale: string }>
    children: React.ReactNode
}

export default async function LocaleLayout({ params, children }: IProps) {
    const { locale } = await params
    if (!locales.includes(locale)) return redirect(`/`)

    const headersList = await headers()
    const pathname = headersList.get("x-pathname") || "/"
    const dictionary = await getDictionary(locale as Locale)

    return <SystemProvider pathname={pathname} locale={locale} dictionary={dictionary}>
        {children}
    </SystemProvider >
}