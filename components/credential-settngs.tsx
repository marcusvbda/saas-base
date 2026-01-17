'use client';

import SectionSettings from './section-settings';
import { useLocale } from '@/hooks/use-locale';
import z from 'zod';
export default function CredentialSettings() {
	const { t } = useLocale();

	return (
		<SectionSettings
			resource={t('settings')}
			apiPath="/api/auth/profile/password-update"
			validator={(form: any) => {
				return z.object({
					password: z
						.string()
						.min(6, t('Password must be at least 6 characters'))
						.refine((data) => data === form.confirmPassword, {
							path: ['confirmPassword'],
							message: t('Passwords do not match'),
						}),
					confirmPassword: z
						.string()
						.min(6, t('Password must be at least 6 characters')),
				});
			}}
			initialData={{
				password: '',
				confirmPassword: '',
			}}
			fields={[
				{
					label: t('Password'),
					name: 'password',
					placeholder: t('Enter new password'),
					type: 'password',
					description: t(
						'{resource} must be at least {quantity} characters long',
						{
							resource: t('Password'),
							quantity: 6,
						},
					),
				},
				{
					label: t('Confirm Password'),
					name: 'confirmPassword',
					placeholder: t('Confirm new password'),
					type: 'password',
					description: t(
						'{resource} must be at least {quantity} characters long',
						{
							resource: t('Password'),
							quantity: 6,
						},
					),
				},
			]}
		/>
	);
}
