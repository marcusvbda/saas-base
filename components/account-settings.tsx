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
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useSession } from '@/providers/session.provider';
import { useLocale } from '@/hooks/use-locale';
import { ButtonLoading } from './ui/button-loading';
import z from 'zod';
import { getValidatedParams } from '@/helpers/common';
import { toast } from 'sonner';

export default function AccountSettings() {
	const { t } = useLocale();
	const { session, setSession } = useSession();
	const formSchema = z.object({
		name: z.string().min(1, t('{field} is required', { field: t('Name') })),
	});
	const [isPending, startTransition] = useTransition();
	const [form, setForm] = useState<any>({
		name: session?.user.name || '',
		errors: null,
	});

	const handleUpdateProfile = (e: FormEvent) => {
		e.preventDefault();
		startTransition(async () => {
			const validatedFields: any = await getValidatedParams(form, formSchema);
			if (!validatedFields.success) {
				return setForm({
					...form,
					errors: validatedFields.data,
				});
			}

			await fetch('/api/auth/profile/data-update', {
				method: 'PUT',
				body: JSON.stringify({ name: validatedFields.data.name }),
			});

			toast.success(
				t('{resource} updated successfully', { resource: t('Profile') })
			);

			setSession({
				...session,
				user: {
					...session?.user,
					name: validatedFields.data.name,
				},
			});
		});
	};

	return (
		<form onSubmit={handleUpdateProfile} className="space-y-6">
			<FieldGroup>
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
				<Field>
					<FieldLabel>
						<FieldTitle>{t('Name')}</FieldTitle>
					</FieldLabel>
					<FieldContent>
						<Input
							type="text"
							placeholder={t('Enter your name')}
							value={form.name}
							onChange={(e) => setForm({ ...form, name: e.target.value })}
							aria-invalid={form.errors?.name ? 'true' : undefined}
						/>
						<FieldError className="text-red-500 mt-2">
							{form.errors?.name}
						</FieldError>
						<FieldDescription>
							{t(
								'This is your display name. It can be your real name or a pseudonym'
							)}
							.
						</FieldDescription>
					</FieldContent>
				</Field>
			</FieldGroup>

			<Separator />

			<div className="flex justify-end">
				<ButtonLoading isLoading={isPending} type="submit">
					{t('Update profile')}
				</ButtonLoading>
			</div>
		</form>
	);
}
