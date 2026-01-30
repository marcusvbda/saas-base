'use client';

import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { getValidatedParams } from '@/helpers/common';
import { forgotPassword } from '@/lib/better-auth/auth-client';
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LocaleLink } from '@/components/locale';
import { toast } from 'sonner';
import { useLocale } from '@/hooks/use-locale';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';

export default function ForgotPasswordPage() {
	const { t } = useLocale();
	const formSchema = z.object({
		email: z.string().email(t('Invalid email')),
	});

	const [form, setForm] = useState<any>({
		email: '',
		errors: null,
	});
	const { router } = useLocale();

	const forgotPasswordMutation = useMutation({
		mutationFn: async (email: string) => {
			const result = await forgotPassword.email({ email });
			if (result.error) throw new Error(result.error.message);
			return result;
		},
		onSuccess: () => {
			toast.success(t('Reset password email sent'));
			router.push('/sign-in');
		},
		onError: (error: Error) => {
			setForm((prev: any) => ({
				...prev,
				errors: { email: error.message },
			}));
		},
	});

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		try {
			const validatedFields: any = await getValidatedParams(form, formSchema);
			if (!validatedFields.success) {
				setForm((prev: any) => ({
					...prev,
					errors: validatedFields.data,
				}));
				return;
			}
			setForm((prev: any) => ({ ...prev, errors: null }));
			forgotPasswordMutation.mutate(validatedFields.data.email);
		} catch (error: any) {
			toast.error(error.message as string);
		}
	};

	return (
		<div className="min-h-screen flex">
			{/* Left Column - Form */}
			<div className="flex-1 flex items-center justify-center p-8 bg-background">
				<div className="w-full max-w-md space-y-6">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold tracking-tight">
							{t('Forgot your password')}
						</h1>
						<p className="text-muted-foreground">
							{t(
								'Enter your email address and we will send you a link to reset your password',
							)}
						</p>
					</div>
					<form onSubmit={handleSubmit} className="space-y-4">
						<Field>
							<FieldLabel>{t('Email')}</FieldLabel>
							<FieldContent className="gap-0">
								<Input
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
									aria-invalid={form.errors?.email ? 'true' : undefined}
								/>
								<FieldError className="text-red-500 ">
									{form.errors?.email}
								</FieldError>
							</FieldContent>
						</Field>
						<Button
							type="submit"
							className="w-full"
							disabled={forgotPasswordMutation.isPending}
						>
							{forgotPasswordMutation.isPending
								? t('Loading…')
								: t('Send reset password email')}
						</Button>
						<div className="text-center">
							<LocaleLink
								href="/sign-in"
								className="text-sm text-primary hover:underline"
							>
								{t('Go back to login')}
							</LocaleLink>
						</div>
					</form>
				</div>
			</div>

			{/* Right Column - Visual */}
			<div className="hidden lg:flex lg:flex-1 items-center justify-center p-8 bg-muted relative overflow-hidden">
				<div className="absolute inset-0 bg-linear-to-br from-primary/10 via-primary/5 to-transparent" />
				<div className="relative z-10 space-y-6 text-center max-w-md">
					<div className="space-y-2">
						<h2 className="text-4xl font-bold tracking-tight">
							{t('Reset your password')}
						</h2>
						<p className="text-lg text-muted-foreground">
							{t('No worries, we will help you recover your account access')}
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
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-semibold">{t('Check your email')}</h3>
								<p className="text-sm text-muted-foreground">
									{t('We will send you a secure link to reset your password')}
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
								<h3 className="font-semibold">{t('Secure process')}</h3>
								<p className="text-sm text-muted-foreground">
									{t(
										'Your password reset link is encrypted and time-limited for your security',
									)}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
