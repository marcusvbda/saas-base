'use client';

import { useLocale } from '@/hooks/use-locale';
import SectionSettings from './section-settings';
import z from 'zod';
import { useSession } from '@/providers/session.provider';
import { useEffect, useState } from 'react';

export default function GeneralSettings() {
	const { t, locale } = useLocale();
	const { session, setSession } = useSession();
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) return null;

	return (
		<SectionSettings
			resource={t('timezone')}
			apiPath="/api/settings/general-update"
			validator={() => {
				return z.object({
					timezone: z
						.string()
						.min(1, t('{field} is required', { field: t('Timezone') })),
				});
			}}
			initialData={{
				timezone:
					session?.settings?.timezone ||
					Intl.DateTimeFormat().resolvedOptions().timeZone,
			}}
			fields={[
				{
					label: t('Timezone'),
					name: 'timezone',
					type: 'select',
					placeholder: t('Select your timezone'),
					description: (form: any) => {
						if (!form.timezone) return '';
						const tzLocale = ['pt'].includes(locale) ? 'pt-BR' : 'en-US';

						const formattedSelectedTz = new Date().toLocaleString(tzLocale, {
							timeZone: form.timezone,
						});
						return formattedSelectedTz;
					},
					options: Intl.supportedValuesOf('timeZone').map((tz) => ({
						label: tz,
						value: tz,
					})),
				},
			]}
			onSuccess={({ data }: any) => {
				setSession({
					...session,
					user: {
						...session?.user,
						timezone: data.timezone,
					},
				});
			}}
		/>
	);
}
