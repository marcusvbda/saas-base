'use client';

import { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';
import BasePage from '../base-page';
import { Card, CardContent } from '@/components/ui/card';
import IntegrationsSidebar from '@/components/integrations-sidebar';
import RepositoryProvider from '@/components/repository-provider';
import AIIntegration from '@/components/ai-integration';
import type { ISettingsSection } from '@/components/integrations-sidebar';

export default function IntegrationsPage() {
	const { t } = useLocale();
	const [activeSection, setActiveSection] = useState<ISettingsSection>(
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
					activeSection={activeSection}
					onSectionChange={setActiveSection}
				/>
				<Card className="w-full space-y-1">
					<CardContent>
						{activeSection === 'repository-provider' && <RepositoryProvider />}
						{activeSection === 'ai' && <AIIntegration />}
					</CardContent>
				</Card>
			</div>
		</BasePage>
	);
}
