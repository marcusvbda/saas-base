'use client';
import { useLocale } from '@/hooks/use-locale';
import Link, { LinkProps } from 'next/link';
import { useMemo } from 'react';

export const LocaleLink = ({
	href,
	className,
	children,
	...props
}: {
	href: string;
	className?: string;
	children?: React.ReactNode;
} & LinkProps) => {
	const { locale } = useLocale();
	const localizedHref = useMemo(() => `/${locale}${href}`, [locale, href]);
	return (
		<Link
			href={localizedHref}
			className={className}
			{...props}
			suppressHydrationWarning
		>
			{children}
		</Link>
	);
};
