'use client';

import { FormEvent, useState, useTransition } from 'react';
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from '@/components/ui/field';
import { InputPassword } from '@/components/ui/input-password';
import { useSession } from '@/providers/session.provider';
import { useLocale } from '@/hooks/use-locale';
import { ButtonLoading } from './ui/button-loading';
import z from 'zod';
import { getValidatedParams } from '@/helpers/common';
import { toast } from 'sonner';

export default function CredentialSettings() {
	const { t } = useLocale();
	const { session, setSession } = useSession();
	const formSchema = z.object({
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
	const [isPending, startTransition] = useTransition();
	const [form, setForm] = useState<any>({
		password: '',
		confirmPassword: '',
		errors: null,
	});

	const handleUpdatePassword = (e: FormEvent) => {
		e.preventDefault();
		startTransition(async () => {
			const validatedFields: any = await getValidatedParams(form, formSchema);
			if (!validatedFields.success) {
				return setForm({ ...form, errors: validatedFields.data });
			}

			await fetch('/api/auth/profile/password-update', {
				method: 'PUT',
				body: JSON.stringify({ password: validatedFields.data.password }),
			});

			toast.success(
				t('{resource} updated successfully', { resource: t('Password') })
			);

			setForm({ ...form, password: '', confirmPassword: '', errors: null });
		});
	};

	return (
		<form onSubmit={handleUpdatePassword} className="space-y-6">
			<FieldGroup>
				<Field>
					<FieldLabel>
						<FieldTitle>{t('New Password')}</FieldTitle>
					</FieldLabel>
					<FieldContent>
						<InputPassword
							value={form.password}
							onChange={(e) => setForm({ ...form, password: e.target.value })}
							placeholder={t('Enter new password')}
							aria-invalid={form.errors?.password ? 'true' : undefined}
						/>
						<FieldError className="text-red-500 mt-2">
							{form.errors?.password}
						</FieldError>
						<FieldDescription>
							{t('{resource} must be at least {quantity} characters long', {
								resource: t('Password'),
								quantity: 6,
							})}
							.
						</FieldDescription>
					</FieldContent>
				</Field>

				<Field>
					<FieldLabel>
						<FieldTitle>{t('Confirm Password')}</FieldTitle>
					</FieldLabel>
					<FieldContent>
						<InputPassword
							value={form.confirmPassword}
							onChange={(e) =>
								setForm({ ...form, confirmPassword: e.target.value })
							}
							aria-invalid={form.errors?.confirmPassword ? 'true' : undefined}
							placeholder={t('Confirm new password')}
						/>
						<FieldError className="text-red-500 mt-2">
							{form.errors?.confirmPassword}
						</FieldError>
						<FieldDescription>
							{t('Please confirm your new password')}.
						</FieldDescription>
					</FieldContent>
				</Field>
			</FieldGroup>

			<div className="flex justify-end">
				<ButtonLoading isLoading={isPending} type="submit">
					{t('Update {resource}', { resource: t('credentials') })}
				</ButtonLoading>
			</div>
		</form>
	);
}
