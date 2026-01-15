'use client';
import BasePage from './base-page';
import { useLocale } from '@/hooks/use-locale';

export default function DashboardPage() {
	const { t } = useLocale();
	return (
		<BasePage
			breadcrumbItems={[{ title: 'Dashboard' }]}
			title={t('Dashboard')}
			description={t('Welcome to the dashboard')}
		>
			dashboard
		</BasePage>
	);
}
