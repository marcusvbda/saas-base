'use client';

import { FormEvent, useState } from 'react';
import { signUp } from '@/lib/better-auth/auth-client';
import { z } from 'zod';
import { getValidatedParams } from '@/helpers/common';
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputPassword } from '@/components/ui/input-password';
import { toast } from 'sonner';
import { LocaleLink } from '@/components/locale';
import { useLocale } from '@/hooks/use-locale';
import { SocialLoginProvider } from '@/components/social-login-provider';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';

export default function RegisterForm() {
	const { t } = useLocale();
	const [form, setForm] = useState<any>({
		email: '',
		password: '',
		name: '',
		passwordConfirmation: '',
		errors: null,
	});

	const formSchema = z.object({
		email: z.string().email(t('Invalid email')),
		password: z.string().min(6, t('Password must be at least 6 characters')),
		passwordConfirmation: z
			.string()
			.min(6, t('Password must be at least 6 characters'))
			.refine((data) => data === form.password, {
				message: t('Passwords do not match'),
				path: ['passwordConfirmation'],
			}),
		name: z.string().min(1, t('Name is required')),
	});

	const { router } = useLocale();

	const signUpMutation = useMutation({
		mutationFn: async ({
			email,
			password,
			name,
		}: {
			email: string;
			password: string;
			name: string;
		}) => {
			const result = await signUp.email({
				email,
				password,
				name,
			});
			if (result.error) throw new Error(result.error.message);
			return result;
		},
		onSuccess: () => {
			toast.success(t('Check your email for verification'));
			router.push('/sign-in');
		},
		onError: (error: Error) => {
			setForm((prev: any) => ({
				...prev,
				errors: { name: t(error.message) },
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
			signUpMutation.mutate({
				email: validatedFields.data.email,
				password: validatedFields.data.password,
				name: validatedFields.data.name,
			});
		} catch (error: any) {
			toast.error(t((error?.message as string) || 'Something went wrong'));
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
							{t('Create your account')}
						</h2>
						<p className="text-lg text-muted-foreground">
							{t('Join us today and start your journey with our platform')}
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
										d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-semibold">{t('Personal account')}</h3>
								<p className="text-sm text-muted-foreground">
									{t(
										'Create your personal account and customize your experience',
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
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-semibold">{t('Easy setup')}</h3>
								<p className="text-sm text-muted-foreground">
									{t(
										'Get started in minutes with our simple registration process',
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
							{t('Create account')}
						</h1>
						<p className="text-muted-foreground">
							{t('Enter your information to create your account')}
						</p>
					</div>
					<form onSubmit={handleSubmit} className="space-y-4">
						<Field>
							<FieldLabel>{t('Name')}</FieldLabel>
							<FieldContent className="gap-0">
								<Input
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
									aria-invalid={form.errors?.name ? 'true' : undefined}
								/>
								<FieldError className="text-red-500 ">
									{form.errors?.name}
								</FieldError>
							</FieldContent>
						</Field>
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
						<Field>
							<FieldLabel>{t('Password')}</FieldLabel>
							<FieldContent className="gap-0">
								<InputPassword
									value={form.password}
									onChange={(e) =>
										setForm({ ...form, password: e.target.value })
									}
									aria-invalid={form.errors?.password ? 'true' : undefined}
								/>
								<FieldError className="text-red-500 ">
									{form.errors?.password}
								</FieldError>
							</FieldContent>
						</Field>
						<Field>
							<FieldLabel>{t('Password Confirmation')}</FieldLabel>
							<FieldContent className="gap-0">
								<InputPassword
									value={form.passwordConfirmation}
									onChange={(e) =>
										setForm({
											...form,
											passwordConfirmation: e.target.value,
										})
									}
									aria-invalid={
										form.errors?.passwordConfirmation ? 'true' : undefined
									}
								/>
								<FieldError className="text-red-500 ">
									{form.errors?.passwordConfirmation}
								</FieldError>
							</FieldContent>
						</Field>
						<Button
							type="submit"
							className="w-full"
							disabled={signUpMutation.isPending}
						>
							{signUpMutation.isPending ? t('Loading…') : t('Register')}
						</Button>
						<SocialLoginProvider />
						<p className="text-center text-sm text-muted-foreground">
							{t('Has already an account')}?{' '}
							<LocaleLink
								href="/sign-in"
								className="text-primary hover:underline font-medium"
							>
								{t('Sign in')}
							</LocaleLink>
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}
