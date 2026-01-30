'use client';

import { Activity, useEffect, useState } from 'react';
import { useLocale } from '@/hooks/use-locale';
import BasePage from '../base-page';
import SettingsSidebar from '@/components/settings-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { useQueryState } from '@/hooks/use-query-state';
import AccountSettings from '@/components/account-settings';
import GeneralSettings from '@/components/general-settings';
import CredentialSettings from '@/components/credential-settngs';
import Loading from '@/components/loading';
import dynamic from 'next/dynamic';
const PlanSettings = dynamic(() => import('@/components/plan-settings'), {
	ssr: false,
	loading: () => <Loading />,
});

export const SettingsSections = ['account', 'credentials', 'general', 'plan'];
export type ISettingsSection = (typeof SettingsSections)[number];

export default function SettingsPage() {
	const { t } = useLocale();
	const [urlSection, setUrlSection] = useQueryState(
		'section',
		SettingsSections,
		'account',
	);
	const [visibleSection, setVisibleSection] = useState<ISettingsSection>(
		(urlSection as ISettingsSection) ?? 'account',
	);

	// Sync visible section when URL changes (e.g. browser back/forward)
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: sync display from URL
		setVisibleSection((urlSection as ISettingsSection) ?? 'account');
	}, [urlSection]);

	const handleSectionChange = (section: ISettingsSection) => {
		setVisibleSection(section);
		setUrlSection(section);
	};

	return (
		<BasePage
			breadcrumbItems={[
				{ title: t('Dashboard'), url: '/' },
				{ title: t('Settings') },
			]}
			title={t('Settings')}
			description={t(
				'Manage your account settings and set e-mail preferences.',
			)}
		>
			<div className="gap-6 w-full grid grid-cols-1 md:grid-cols-[1fr_4fr]">
				<SettingsSidebar
					activeSection={visibleSection}
					onSectionChange={handleSectionChange}
				/>
				<Card className="w-full space-y-1">
					<CardContent>
						<Activity
							mode={visibleSection === 'account' ? 'visible' : 'hidden'}
						>
							<AccountSettings />
						</Activity>
						<Activity
							mode={visibleSection === 'credentials' ? 'visible' : 'hidden'}
						>
							<CredentialSettings />
						</Activity>
						<Activity
							mode={visibleSection === 'general' ? 'visible' : 'hidden'}
						>
							<GeneralSettings />
						</Activity>
						<Activity mode={visibleSection === 'plan' ? 'visible' : 'hidden'}>
							<PlanSettings />
						</Activity>
					</CardContent>
				</Card>
			</div>
		</BasePage>
	);
}
