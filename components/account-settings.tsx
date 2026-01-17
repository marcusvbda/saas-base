'use client';

import z from 'zod';
import SectionSettings from './section-settings';
import { useLocale } from '@/hooks/use-locale';
import {
	Field,
	FieldTitle,
	FieldLabel,
	FieldContent,
	FieldDescription,
} from './ui/field';
import { Input } from './ui/input';
import { useSession } from '@/providers/session.provider';

export default function AccountSettings() {
	const { t } = useLocale();
	const { session, setSession } = useSession();

	return (
		<SectionSettings
			resource={t('profile')}
			apiPath="/api/auth/profile/data-update"
			validator={() => {
				return z.object({
					name: z
						.string()
						.min(1, t('{field} is required', { field: t('Name') })),
				});
			}}
			initialData={{
				name: session?.user.name || '',
			}}
			onSuccess={({ data }: any) => {
				setSession({
					...session,
					user: {
						...session?.user,
						name: data.name,
					},
				});
			}}
			fields={[
				{
					label: t('Name'),
					name: 'name',
					description: t(
						'This is your display name. It can be your real name or a pseudonym',
					),
					type: 'text',
				},
			]}
		>
			<Field>
				<FieldLabel>
					<FieldTitle>Email</FieldTitle>
				</FieldLabel>
				<FieldContent>
					<Input
						type="email"
						disabled
						className="bg-muted"
						value={session?.user.email}
						readOnly
					/>
					<FieldDescription>
						{t('Your email address cannot be changed')}.
					</FieldDescription>
				</FieldContent>
			</Field>
		</SectionSettings>
	);
}
