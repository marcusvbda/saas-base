'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { locales, type Locale } from '@/i18n/dictionaries';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/hooks/use-locale';

const localeFlags: Record<Locale, string> = {
	en: '🇺🇸',
	pt: '🇧🇷',
};

export function LanguageSelector() {
	const { t, locale } = useLocale();
	const searchParams = useSearchParams();
	const router = useRouter();
	const pathname = usePathname();

	const localeLabels: Record<Locale, string> = {
		en: t('English'),
		pt: t('Portuguese') + ' (BR)',
	};

	const changeLocale = (newLocale: Locale) => {
		// Save to cookie

		// eslint-disable-next-line react-hooks/immutability
		document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

		// Update the URL by replacing the locale segment
		const pathWithoutLocale = pathname.replace(/^\/[^/]+/, '');
		const queryString = searchParams.toString();
		const newPath = `/${newLocale}${pathWithoutLocale || '/'}${
			queryString ? `?${queryString}` : ''
		}`;
		router.push(newPath);
		router.refresh();
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-9 w-9">
					<span className="text-2xl">
						{localeFlags[locale as Locale] || '🌐'}
					</span>
					<span className="sr-only">Select language</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{locales.map((loc) => (
					<DropdownMenuItem
						key={loc}
						onClick={() => changeLocale(loc as Locale)}
						className={locale === loc ? 'bg-accent' : ''}
					>
						<span className="flex items-center gap-2">
							<span className="text-2xl">{localeFlags[loc as Locale]}</span>
							<span className="text-sm">{localeLabels[loc as Locale]}</span>
						</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
