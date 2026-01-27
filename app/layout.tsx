import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query.provider';
import { ThemeProvider } from '@/providers/theme.provider';
import { cookies } from 'next/headers';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
	display: 'swap',
	preload: true,
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
	display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
	return {
		title: {
			default: 'SaaS Base',
			template: '%s | SaaS Base',
		},
		description: 'Modern SaaS application built with Next.js',
		metadataBase: new URL(
			process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
		),
	};
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const cookieStore = await cookies();
	const themeCookie = cookieStore.get('theme')?.value;
	const defaultTheme =
		themeCookie === 'dark' ||
		themeCookie === 'light' ||
		themeCookie === 'system'
			? themeCookie
			: 'system';

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<ThemeProvider defaultTheme={defaultTheme} enableSystem>
					<QueryProvider>{children}</QueryProvider>
					<Toaster position="top-center" richColors />
				</ThemeProvider>
			</body>
		</html>
	);
}
