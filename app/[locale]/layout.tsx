import { headers } from 'next/headers';
import { getDictionary, locales, hasLocale, Locale } from '@/i18n/translation';
import { redirect } from 'next/navigation';
import { SystemProvider } from '@/providers/system.provider';
import { IWithChildren } from '@/types/common';

export default async function LocaleLayout({
	params,
	children,
}: IWithChildren & { params: Promise<{ locale: string }> }) {
	const { locale } = await params;
	const lowerCaseLocale = locale.toLowerCase() as Locale;

	if (!locales.includes(lowerCaseLocale)) {
		return redirect(`/`);
	}

	const headersList = await headers();
	const pathname = headersList.get('x-pathname') || '/';

	const dictionary = hasLocale(lowerCaseLocale)
		? await getDictionary(lowerCaseLocale)
		: {};

	return (
		<SystemProvider
			pathname={pathname}
			locale={locale.toLowerCase()}
			dictionary={dictionary}
		>
			{children}
		</SystemProvider>
	);
}
