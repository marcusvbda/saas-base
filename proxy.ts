import { NextRequest, NextResponse } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { defaultLocale, locales } from './i18n/translation';

export function getPreferredLocale(request: NextRequest): string {
	const cookieLocale = request.cookies.get('locale')?.value;

	if (cookieLocale && locales.includes(cookieLocale as any)) {
		return cookieLocale;
	}

	const acceptLanguage = request.headers.get('accept-language');

	if (acceptLanguage) {
		const languages = new Negotiator({
			headers: { 'accept-language': acceptLanguage },
		}).languages();

		return match(languages, locales, defaultLocale);
	}

	return defaultLocale;
}

export function proxy(request: NextRequest) {
	const res = NextResponse.next();
	const pathname = request.nextUrl.pathname;

	const splitPathname = pathname.split('/');
	const pathnameLocale = String(splitPathname[1] || '').toLowerCase();
	const pathnameHasLocale = locales.includes(pathnameLocale);

	if (!pathnameHasLocale) {
		const locale = getPreferredLocale(request);
		request.nextUrl.pathname = `/${locale}${pathname}`;
		return NextResponse.redirect(request.nextUrl);
	}

	res.headers.set('x-pathname', pathname);
	return res;
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|public|.well-known|favicon.ico).*)',
	],
};
