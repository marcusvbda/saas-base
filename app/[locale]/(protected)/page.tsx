'use client';
import PlanGate from '@/components/plan-gate';
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
			<PlanGate allowedPlans={['free']}>dashboard</PlanGate>
		</BasePage>
	);
}
