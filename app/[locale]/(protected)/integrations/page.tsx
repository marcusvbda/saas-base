'use client';

import { useLocale } from '@/hooks/use-locale';
import BasePage from '../base-page';
import { Card, CardContent } from '@/components/ui/card';
import IntegrationsSidebar from '@/components/integrations-sidebar';
import RepositoryProvider from '@/components/repository-provider';

export const SettingsSections = ['repository-provider'] as const;
export type ISettingsSection = (typeof SettingsSections)[number];

export default function IntegrationsPage() {
	const { t } = useLocale();

	return (
		<BasePage
			breadcrumbItems={[
				{ title: 'Dashboard', url: '/' },
				{ title: t('Integrations') },
			]}
			title={t('Integrations')}
			description={t('Manage your integrations')}
		>
			<div className="gap-6 w-full grid grid-cols-1 md:grid-cols-[1fr_4fr]">
				<IntegrationsSidebar />
				<Card className="w-full space-y-1">
					<CardContent>
						<RepositoryProvider />
					</CardContent>
				</Card>
			</div>
		</BasePage>
	);
}
