'use client';

import { useLocale } from '@/hooks/use-locale';
import SectionSettings from './section-settings';
import z from 'zod';
import { useSession } from '@/providers/session.provider';

const UTC_OFFSETS = Array.from({ length: 25 }, (_, i) => {
	const offset = i - 12;
	if (offset === 0) return 'UTC±00';
	return `UTC${offset > 0 ? '+' : ''}${offset.toString().padStart(2, '0')}`;
});

export default function GeneralSettings() {
	const { t } = useLocale();
	const { session, setSession } = useSession();

	const formatUTCOffset = (hours: number) => {
		if (hours === 0) return 'UTC±00';
		const sign = hours > 0 ? '+' : '';
		return `UTC${sign}${hours.toString().padStart(2, '0')}`;
	};

	const getCurrentTimezone = () => {
		const offsetMinutes = new Date().getTimezoneOffset();
		const offsetHours = -offsetMinutes / 60;
		const currentOffset = formatUTCOffset(offsetHours);
		return currentOffset;
	};

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
				timezone: session?.settings?.timezone || getCurrentTimezone(),
			}}
			fields={[
				{
					label: t('Timezone'),
					name: 'timezone',
					type: 'select',
					placeholder: t('Select your timezone'),
					options: UTC_OFFSETS.map((tz) => ({
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
