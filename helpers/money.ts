import { Locale } from '@/i18n/translation';

export const formatPrice = (
	price: { BRL: number; USD: number },
	locale: Locale,
) => {
	const currency = locale === 'pt' ? 'BRL' : 'USD';
	return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
		style: 'currency',
		currency: currency,
		minimumFractionDigits: 0,
	}).format(price[currency]);
};
