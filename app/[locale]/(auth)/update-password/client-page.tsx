'use client';

import { FormEvent, useState, useTransition } from 'react';
import { z } from 'zod';
import { getValidatedParams } from '@/helpers/common';
import { toast } from 'sonner';
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from '@/components/ui/field';
import { InputPassword } from '@/components/ui/input-password';
import { ButtonLoading } from '@/components/ui/button-loading';
import { useLocale } from '@/hooks/use-locale';

export default function ClientPage({ token }: { token: string }) {
	const { t, router } = useLocale();

	const formSchema = z
		.object({
			password: z.string().min(6, t('Password must be at least 6 characters')),
			confirmPassword: z
				.string()
				.min(6, t('Confirm password must be at least 6 characters')),
		})
		.refine((data) => data.password === data.confirmPassword, {
			path: ['confirmPassword'],
			message: t('Passwords do not match'),
		});

	const [form, setForm] = useState<any>({
		password: '',
		confirmPassword: '',
		errors: null,
	});
	const [isPending, startTransition] = useTransition();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const validatedFields: any = await getValidatedParams(form, formSchema);
			if (!validatedFields.success) {
				return setForm({
					...form,
					errors: validatedFields.data,
				});
			}

			startTransition(async () => {
				setForm({
					...form,
					errors: null,
				});

				const response = await fetch('/api/auth/reset-password', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						token,
						newPassword: validatedFields.data.password,
					}),
				});

				const result = await response.json();

				if (!response.ok || result.error) {
					return setForm({
						...form,
						errors: {
							password: result.error?.message,
						},
					});
				} else {
					toast.success(t('Password updated successfully'));
					router.push('/sign-in');
				}
			});
		} catch (err: any) {
			toast.error(err.message);
		}
	};

	return (
		<div className="min-h-screen flex">
			{/* Left Column - Visual */}
			<div className="hidden lg:flex lg:flex-1 items-center justify-center p-8 bg-muted relative overflow-hidden">
				<div className="absolute inset-0 bg-linear-to-br from-primary/10 via-primary/5 to-transparent" />
				<div className="relative z-10 space-y-6 text-center max-w-md">
					<div className="space-y-2">
						<h2 className="text-4xl font-bold tracking-tight">
							{t('Set a new password')}
						</h2>
						<p className="text-lg text-muted-foreground">
							{t('Choose a strong password to keep your account secure')}
						</p>
					</div>
					<div className="flex flex-col gap-4 pt-8">
						<div className="flex items-center gap-3 text-left">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
								<svg
									className="h-5 w-5 text-primary"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-semibold">{t('Strong password')}</h3>
								<p className="text-sm text-muted-foreground">
									{t(
										'Use a combination of letters, numbers and special characters'
									)}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-3 text-left">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
								<svg
									className="h-5 w-5 text-primary"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-semibold">{t('Keep it secure')}</h3>
								<p className="text-sm text-muted-foreground">
									{t(
										'Never share your password with anyone and change it regularly'
									)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Right Column - Form */}
			<div className="flex-1 flex items-center justify-center p-8 bg-background">
				<div className="w-full max-w-md space-y-6">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold tracking-tight">
							{t('Update Password')}
						</h1>
						<p className="text-muted-foreground">
							{t('Enter your new password below')}
						</p>
					</div>
					<form onSubmit={handleSubmit} className="space-y-4">
						<Field>
							<FieldLabel>{t('New Password')}</FieldLabel>
							<FieldContent className="gap-0">
								<InputPassword
									value={form.password}
									onChange={(e) =>
										setForm({ ...form, password: e.target.value })
									}
									aria-invalid={form.errors?.password ? 'true' : undefined}
								/>
								<FieldError className="text-red-500 mt-2">
									{form.errors?.password}
								</FieldError>
							</FieldContent>
						</Field>
						<Field>
							<FieldLabel>{t('Confirm Password')}</FieldLabel>
							<FieldContent className="gap-0">
								<InputPassword
									value={form.confirmPassword}
									onChange={(e) =>
										setForm({ ...form, confirmPassword: e.target.value })
									}
									aria-invalid={
										form.errors?.confirmPassword ? 'true' : undefined
									}
								/>
								<FieldError className="text-red-500 mt-2">
									{form.errors?.confirmPassword}
								</FieldError>
							</FieldContent>
						</Field>
						<ButtonLoading
							type="submit"
							isLoading={isPending}
							className="w-full"
						>
							{t('Update Password')}
						</ButtonLoading>
					</form>
				</div>
			</div>
		</div>
	);
}
