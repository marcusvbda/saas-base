'use client';

import { processParams } from '@/i18n/dictionaries';
import { useSystem } from '@/providers/system.provider';
import { useRouter } from 'next/navigation';

export const useLocale = () => {
	const { dictionary } = useSystem();
	const translate = (key: string, params?: any) => {
		try {
			const target = dictionary?.[key] ? dictionary[key] : key;
			return processParams(target, params || {});
		} catch {
			return key;
		}
	};

	const { locale } = useSystem();
	const router = useRouter();
	const push = (href: string, options?: any) => {
		router.push(`/${locale}${href}`, options);
	};

	return {
		t: translate,
		locale: locale,
		router: {
			...router,
			push: push,
		},
	};
};
