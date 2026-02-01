'use client';

import { useLocale } from '@/hooks/use-locale';
import BasePage from '../base-page';
import { Card, CardContent } from '@/components/ui/card';
import { useQueryState } from '@/hooks/use-query-state';
import IntegrationsSidebar from '@/components/integrations-sidebar';
import RepositoryProvider from '@/components/repository-provider';
import TaskManagerProvider from '@/components/task-manager-provider';
import CommunicationProvider from '@/components/communication-provider';
import { Activity } from 'react';
export const SettingsSections = [
	'repository-provider',
	'task-manager',
	'communication-provider',
];
export type ISettingsSection = (typeof SettingsSections)[number];

export default function IntegrationsPage() {
	const { t } = useLocale();
	const [activeSection, setActiveSection] = useQueryState(
		'section',
		SettingsSections,
		'repository-provider',
	);

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
				<IntegrationsSidebar
					activeSection={activeSection as ISettingsSection}
					onSectionChange={
						setActiveSection as (section: ISettingsSection) => void
					}
				/>
				<Card className="w-full space-y-1">
					<CardContent>
						<Activity
							mode={
								activeSection === 'repository-provider' ? 'visible' : 'hidden'
							}
						>
							<RepositoryProvider />
						</Activity>
						<Activity
							mode={activeSection === 'task-manager' ? 'visible' : 'hidden'}
						>
							<TaskManagerProvider />
						</Activity>
						<Activity
							mode={
								activeSection === 'communication-provider'
									? 'visible'
									: 'hidden'
							}
						>
							<CommunicationProvider />
						</Activity>
					</CardContent>
				</Card>
			</div>
		</BasePage>
	);
}
