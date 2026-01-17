'use client';

import SectionSettings from './section-settings';
import { useLocale } from '@/hooks/use-locale';
import { useSession } from '@/providers/session.provider';
import { useEffect, useState } from 'react';
import { DEFAULT_PLAN } from '@/constants/plans';
import z from 'zod';
import PlanSelector from './plan-selector';

export default function PlanSettings() {
	const { t } = useLocale();
	const { session, setSession } = useSession();
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsClient(true);
	}, []);

	if (!isClient) return null;

	return (
		<SectionSettings
			resource={t('plan')}
			apiPath="/api/settings/general-update"
			validator={() => {
				return z.object({
					plan: z
						.string()
						.min(1, t('{field} is required', { field: t('Plan') })),
				});
			}}
			initialData={{
				plan: session?.settings?.plan || DEFAULT_PLAN,
			}}
			fields={[
				{
					label: t('Select your plan'),
					name: 'plan',
					type: 'custom',
					component: PlanSelector,
				},
			]}
			onSuccess={({ data }: any) => {
				setSession({
					...session,
					settings: {
						...session?.settings,
						plan: data.plan,
					},
				});
			}}
		/>
	);
}
