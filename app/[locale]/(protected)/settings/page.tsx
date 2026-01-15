'use client';

import { useLocale } from '@/hooks/use-locale';
import BasePage from '../base-page';

export default function SettingsPage() {
	const { t } = useLocale();
	return (
		<BasePage
			breadcrumbItems={[
				{ title: 'Dashboard', url: '/' },
				{ title: t('Settings') },
			]}
		>
			{t('Settings')}
		</BasePage>
	);
}
