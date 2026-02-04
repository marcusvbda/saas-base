'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signIn, signOut } from '@/lib/better-auth/auth-client';
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

const FragmentContent = () => {
	useEffect(() => {
		signOut();
	}, []);

	const { t } = useLocale();
	const formSchema = z.object({
		email: z.string().email(t('Invalid email')),
		password: z.string().min(6, t('Password must be at least 6 characters')),
	});
	const searchParams = useSearchParams();
	const redirect = searchParams.get('redirect') || '/';
	const { router } = useLocale();
	const [form, setForm] = useState<any>({
		email: '',
		password: '',
		errors: null,
	});

	const signInMutation = useMutation({
		mutationFn: async ({
			email,
			password,
			callbackURL,
		}: {
			email: string;
			password: string;
			callbackURL: string;
		}) => {
			const result = await signIn.email({
				email,
				password,
				callbackURL,
			});
			if (result.error) throw new Error(result.error.message);
			return result;
		},
		onSuccess: () => {
			router.push('/');
		},
		onError: (error: Error) => {
			setForm((prev: any) => ({
				...prev,
				errors: { email: t(error.message) },
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
			signInMutation.mutate({
				email: validatedFields.data.email,
				password: validatedFields.data.password,
				callbackURL: redirect,
			});
		} catch (error: any) {
			toast.error(t((error?.message as string) || 'Something went wrong'));
		}
	};

	return (
		<div className="min-h-screen flex">
			{/* Left Column - Form */}
			<div className="flex-1 flex items-center justify-center p-8 bg-background">
				<div className="w-full max-w-md space-y-6">
					<div className="space-y-2">
						<h1 className="text-3xl font-bold tracking-tight">{t('Login')}</h1>
						<p className="text-muted-foreground">
							{t('Enter your credentials to access your account')}
						</p>
					</div>
					<form onSubmit={handleSubmit} className="space-y-4">
						<Field>
							<FieldLabel>{t('Email')}</FieldLabel>
							<FieldContent className="gap-0">
								<Input
									value={form.email}
									data-lpignore="true"
									autoComplete="off"
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
						<div className="flex items-center justify-between">
							<LocaleLink
								href="/forgot-password"
								className="text-sm text-primary hover:underline"
							>
								{t('Forgot your password')}
							</LocaleLink>
						</div>
						<Button
							type="submit"
							className="w-full"
							disabled={signInMutation.isPending}
						>
							{signInMutation.isPending ? t('Signing in…') : t('Login')}
						</Button>
						<SocialLoginProvider />
						{process.env.NEXT_PUBLIC_CAN_REGISTER === 'true' && (
							<p className="text-center text-sm text-muted-foreground">
								{t(`Don't have an account`)}?{' '}
								<LocaleLink
									href="/register"
									className="text-primary hover:underline font-medium"
								>
									{t('Create account')}
								</LocaleLink>
							</p>
						)}
					</form>
				</div>
			</div>

			{/* Right Column - Visual */}
			<div className="hidden lg:flex lg:flex-1 items-center justify-center p-8 bg-muted relative overflow-hidden">
				<div className="absolute inset-0 bg-linear-to-br from-primary/10 via-primary/5 to-transparent" />
				<div className="relative z-10 space-y-6 text-center max-w-md">
					<div className="space-y-2">
						<h2 className="text-4xl font-bold tracking-tight">
							{t('Welcome back')}
						</h2>
						<p className="text-lg text-muted-foreground">
							{t('Sign in to continue to your account and access all features')}
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
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-semibold">{t('Secure authentication')}</h3>
								<p className="text-sm text-muted-foreground">
									{t('Your data is protected with industry-standard security')}
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
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<div>
								<h3 className="font-semibold">{t('Fast and reliable')}</h3>
								<p className="text-sm text-muted-foreground">
									{t('Quick access to all your features and tools')}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default function SignInPage() {
	return (
		<Suspense fallback={null}>
			<FragmentContent />
		</Suspense>
	);
}
