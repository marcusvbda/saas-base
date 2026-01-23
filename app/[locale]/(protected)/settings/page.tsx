'use client';

import { Activity } from 'react';
import { useLocale } from '@/hooks/use-locale';
import BasePage from '../base-page';
import SettingsSidebar from '@/components/settings-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { useQueryState } from '@/hooks/use-query-state';
import AccountSettings from '@/components/account-settings';
import GeneralSettings from '@/components/general-settings';
import CredentialSettings from '@/components/credential-settngs';
import PlanSettings from '@/components/plan-settings';

export const SettingsSections = ['account', 'credentials', 'general', 'plan'];
export type ISettingsSection = (typeof SettingsSections)[number];

export default function SettingsPage() {
	const { t } = useLocale();
	const [activeSection, setActiveSection] = useQueryState(
		'section',
		SettingsSections,
		'account',
	);

	return (
		<BasePage
			breadcrumbItems={[
				{ title: 'Dashboard', url: '/' },
				{ title: t('Settings') },
			]}
			title={t('Settings')}
			description={t(
				'Manage your account settings and set e-mail preferences.',
			)}
		>
			<div className="gap-6 w-full grid grid-cols-1 md:grid-cols-[1fr_4fr]">
				<SettingsSidebar
					activeSection={activeSection as ISettingsSection}
					onSectionChange={
						setActiveSection as (section: ISettingsSection) => void
					}
				/>
				<Card className="w-full space-y-1">
					<CardContent>
						<Activity mode={activeSection === 'account' ? 'visible' : 'hidden'}>
							<AccountSettings />
						</Activity>
						<Activity
							mode={activeSection === 'credentials' ? 'visible' : 'hidden'}
						>
							<CredentialSettings />
						</Activity>
						<Activity mode={activeSection === 'general' ? 'visible' : 'hidden'}>
							<GeneralSettings />
						</Activity>
						<Activity mode={activeSection === 'plan' ? 'visible' : 'hidden'}>
							<PlanSettings />
						</Activity>
					</CardContent>
				</Card>
			</div>
		</BasePage>
	);
}
