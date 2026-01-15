'use client';
import { useSystem } from '@/providers/system.provider';
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
	const { locale } = useSystem();
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
