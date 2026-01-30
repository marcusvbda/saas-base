'use client';
import BasePage from './base-page';
import { useLocale } from '@/hooks/use-locale';
import PlanGate from '@/components/plan-gate';

export default function DashboardPage() {
	const { t } = useLocale();

	return (
		<BasePage
			breadcrumbItems={[{ title: 'Dashboard' }]}
			title={t('Dashboard')}
			description={t('Welcome to the dashboard')}
		>
			<PlanGate allowedPlans={['pro']}>TESTE PLAN GATE </PlanGate>
		</BasePage>
	);
}
